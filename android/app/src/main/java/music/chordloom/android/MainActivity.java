package music.chordloom.android;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Base64;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Collections;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Offline, permission-free shell around the same Chordloom music engine as the web app. */
public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + HOST + "/assets/index.html";
    private static final int OPEN_DOCUMENT = 10;
    private static final int CREATE_DOCUMENT = 11;
    private static final int MAX_EXPORT_BYTES = 16 * 1024 * 1024;
    private static final String PAUSE_JS = "(function(){try{if(typeof window.ChordloomPause==='function')window.ChordloomPause();"
            + "window.dispatchEvent(new Event('chordloom-pause'));"
            + "if(typeof stop==='function')stop(false);"
            + "document.querySelectorAll('audio,video').forEach(function(p){p.pause();});}catch(e){}})();";

    private final ExecutorService fileWriter = Executors.newSingleThreadExecutor();
    private WebView webView;
    private FrameLayout container;
    private volatile boolean pageReady;
    private ValueCallback<Uri[]> fileCallback;
    private PendingExport pendingExport;
    private String queuedExportEvent;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(17, 21, 17));
        getWindow().setNavigationBarColor(Color.rgb(17, 21, 17));
        container = new FrameLayout(this);
        container.setBackgroundColor(Color.rgb(17, 21, 17));
        setContentView(container);
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            container.setOnApplyWindowInsetsListener((view, insets) -> {
                Insets bars = insets.getInsets(WindowInsets.Type.systemBars()
                        | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return insets;
            });
            container.requestApplyInsets();
        }
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(17, 21, 17));
        container.addView(webView, new FrameLayout.LayoutParams(-1, -1));
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true); // Only user-selected SAF content URIs are returned by the picker.
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMediaPlaybackRequiresUserGesture(false); // Preview is prepared asynchronously after Play.
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        settings.setBuiltInZoomControls(false);
        webView.addJavascriptInterface(new ExportBridge(), "ChordloomAndroid");
        webView.setWebViewClient(new OfflineClient());
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                                       FileChooserParams params) {
                cancelFileCallback();
                fileCallback = callback;
                Intent picker = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                picker.addCategory(Intent.CATEGORY_OPENABLE);
                // SoundFonts are often advertised as generic binary data by Android providers.
                picker.setType("*/*");
                picker.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                try {
                    startActivityForResult(picker, OPEN_DOCUMENT);
                } catch (ActivityNotFoundException error) {
                    cancelFileCallback();
                    showMessage("No document picker is available on this device.");
                }
                return true;
            }
        });
        webView.setDownloadListener((url, userAgent, disposition, mimeType, size) ->
                showMessage("Use Export MIDI, Export tab, or Save session to save a file."));
        // Save session creates an explicit session file. Orientation changes keep this Activity alive.
        webView.loadUrl(START_URL);
    }

    private static boolean trustedOrigin(Uri uri) {
        return uri != null && "https".equals(uri.getScheme()) && HOST.equals(uri.getHost())
                && (uri.getPort() == -1 || uri.getPort() == 443) && uri.getUserInfo() == null;
    }

    private static boolean trustedDocument(String value) {
        if (value == null) return false;
        Uri uri = Uri.parse(value);
        return trustedOrigin(uri) && "/assets/index.html".equals(uri.getPath()) && uri.getQuery() == null;
    }

    private final class OfflineClient extends WebViewClient {
        @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            if (request.isForMainFrame() && trustedDocument(request.getUrl().toString())) return false;
            showMessage("Chordloom runs offline. External navigation is disabled.");
            return true;
        }

        @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return !trustedDocument(url);
        }

        @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (!"GET".equals(request.getMethod()) || !trustedOrigin(uri)) return blocked();
            String path = uri.getPath();
            if (path == null || !path.startsWith("/assets/")) return blocked();
            String asset = path.substring("/assets/".length());
            if (asset.isEmpty() || asset.contains("\\") || asset.contains("\u0000")) return blocked();
            for (String part : asset.split("/")) if (part.equals("..") || part.equals(".")) return blocked();
            try {
                InputStream input = getAssets().open(asset);
                Map<String, String> headers = new HashMap<>();
                headers.put("Content-Security-Policy", "default-src 'none'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:; "
                        + "style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src blob: data:; "
                        + "worker-src blob:; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'none'");
                headers.put("X-Content-Type-Options", "nosniff");
                headers.put("Cache-Control", "no-store");
                return new WebResourceResponse(mimeFor(asset), "UTF-8", 200, "OK", headers, input);
            } catch (IOException error) {
                return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found",
                        Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
            }
        }

        @Override public void onPageStarted(WebView view, String url, android.graphics.Bitmap icon) {
            pageReady = false;
        }

        @Override public void onPageFinished(WebView view, String url) {
            pageReady = trustedDocument(url);
            if (pageReady && queuedExportEvent != null) {
                String event = queuedExportEvent;
                queuedExportEvent = null;
                dispatchExportEvent(event);
            }
        }

        @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
            pageReady = false;
            cancelFileCallback();
            container.removeView(view);
            view.destroy();
            webView = null;
            showMessage("Android restarted the web renderer. Reopening Chordloom; use Load session to restore a saved session.");
            recreate();
            return true;
        }
    }

    private static WebResourceResponse blocked() {
        return new WebResourceResponse("text/plain", "UTF-8", 403, "Offline only",
                Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
    }

    private static String mimeFor(String path) {
        String lower = path.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".html")) return "text/html";
        if (lower.endsWith(".js") || lower.endsWith(".cjs")) return "application/javascript";
        if (lower.endsWith(".css")) return "text/css";
        if (lower.endsWith(".json")) return "application/json";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".txt") || lower.endsWith(".md")) return "text/plain";
        return "application/octet-stream";
    }

    private final class ExportBridge {
        @JavascriptInterface public void saveFile(String base64, String name, String mime) {
            if (!pageReady) return;
            try {
                if (base64 == null || base64.length() > ((MAX_EXPORT_BYTES + 2L) / 3L) * 4L)
                    throw new IllegalArgumentException("The export is too large (maximum 16 MB).");
                if (name == null || name.length() > 180 || !name.matches("[A-Za-z0-9._ -]+")
                        || name.startsWith(".") || name.contains(".."))
                    throw new IllegalArgumentException("The export filename is invalid.");
                String type = mime == null ? "" : mime.split(";", 2)[0].trim().toLowerCase(Locale.ROOT);
                String lower = name.toLowerCase(Locale.ROOT);
                boolean valid = (type.equals("audio/midi") && lower.endsWith(".mid"))
                        || (type.equals("application/json") && lower.endsWith(".json"))
                        || (type.equals("text/plain") && lower.endsWith(".txt"));
                if (!valid) throw new IllegalArgumentException("Unsupported export type.");
                byte[] data = Base64.decode(base64, Base64.NO_WRAP);
                if (data.length == 0 || data.length > MAX_EXPORT_BYTES)
                    throw new IllegalArgumentException("The export is empty or too large.");
                PendingExport export = new PendingExport(data, name, type);
                runOnUiThread(() -> beginExport(export));
            } catch (IllegalArgumentException error) {
                runOnUiThread(() -> emitExport(false, false, name, error.getMessage()));
            }
        }
    }

    private void beginExport(PendingExport export) {
        if (isFinishing() || isDestroyed() || webView == null || !trustedDocument(webView.getUrl())) return;
        if (pendingExport != null) {
            emitExport(false, false, export.name, "Finish the current save before exporting another file.");
            return;
        }
        pendingExport = export;
        Intent save = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        save.addCategory(Intent.CATEGORY_OPENABLE);
        save.setType(export.mime);
        save.putExtra(Intent.EXTRA_TITLE, export.name);
        save.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        try {
            startActivityForResult(save, CREATE_DOCUMENT);
        } catch (ActivityNotFoundException error) {
            pendingExport = null;
            emitExport(false, false, export.name, "No document picker is available on this device.");
        }
    }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == OPEN_DOCUMENT) {
            ValueCallback<Uri[]> callback = fileCallback;
            fileCallback = null;
            if (callback != null) {
                Uri uri = result == RESULT_OK && data != null ? data.getData() : null;
                callback.onReceiveValue(uri != null && "content".equals(uri.getScheme()) ? new Uri[]{uri} : null);
            }
        } else if (request == CREATE_DOCUMENT) {
            PendingExport export = pendingExport;
            pendingExport = null;
            if (export == null) return; // Android may have recreated the Activity while a picker was open.
            Uri uri = result == RESULT_OK && data != null ? data.getData() : null;
            if (uri == null) {
                emitExport(false, true, export.name, "Save cancelled.");
                return;
            }
            if (!"content".equals(uri.getScheme())) {
                emitExport(false, false, export.name, "The document provider returned an unsupported location.");
                return;
            }
            fileWriter.execute(() -> {
                String errorMessage = null;
                try (OutputStream output = getContentResolver().openOutputStream(uri, "wt")) {
                    if (output == null) throw new IOException("The selected location cannot be written.");
                    output.write(export.bytes);
                    output.flush();
                } catch (IOException | SecurityException error) {
                    errorMessage = error.getMessage();
                }
                final String failure = errorMessage;
                runOnUiThread(() -> emitExport(failure == null, false, export.name,
                        failure == null ? "Saved " + export.name + "." : "Could not save: " + failure));
            });
        }
    }

    private void emitExport(boolean success, boolean cancelled, String name, String message) {
        try {
            JSONObject detail = new JSONObject();
            detail.put("success", success);
            detail.put("cancelled", cancelled);
            detail.put("name", name == null ? "" : name);
            detail.put("message", message == null ? "Could not save file." : message);
            dispatchExportEvent(detail.toString());
        } catch (org.json.JSONException impossible) {
            showMessage("The export status could not be displayed.");
        }
    }

    private void dispatchExportEvent(String json) {
        if (isFinishing() || isDestroyed()) return;
        if (!pageReady || webView == null) { queuedExportEvent = json; return; }
        webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('chordloom-export',{detail:"
                + json + "}));", null);
    }

    private void cancelFileCallback() {
        ValueCallback<Uri[]> old = fileCallback;
        fileCallback = null;
        if (old != null) old.onReceiveValue(null);
    }

    private void showMessage(String value) {
        runOnUiThread(() -> { if (!isFinishing()) Toast.makeText(this, value, Toast.LENGTH_LONG).show(); });
    }

    @Override protected void onPause() {
        if (webView != null) {
            webView.evaluateJavascript(PAUSE_JS, null);
            webView.onPause();
        }
        super.onPause();
    }

    @Override protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override protected void onDestroy() {
        pageReady = false;
        cancelFileCallback();
        pendingExport = null;
        fileWriter.shutdown();
        if (webView != null) {
            webView.evaluateJavascript(PAUSE_JS, null);
            webView.removeJavascriptInterface("ChordloomAndroid");
            container.removeView(webView);
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }

    private static final class PendingExport {
        final byte[] bytes;
        final String name;
        final String mime;
        PendingExport(byte[] bytes, String name, String mime) {
            this.bytes = bytes; this.name = name; this.mime = mime;
        }
    }
}

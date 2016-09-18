package diploma.android.client;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AppCompatActivity;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.google.android.gms.common.GooglePlayServicesUtil;

/**
 * Main activity. Its main concern is to create the web view, get necessary permissions and exit when needed.
 */
public class Main extends AppCompatActivity {
    private ServiceProvider provider;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.main);
        this.getPermissions();
        this.buildWebView();
    }

    /**
     * Builds the Web View which will host the user interface.
     */
    private void buildWebView() {
        WebView webView = (WebView) findViewById(R.id.activity_main_webview);
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setAllowFileAccessFromFileURLs(true);
        webSettings.setAllowUniversalAccessFromFileURLs(true);
        webView.setWebViewClient(provider = new ServiceProvider(this));
        webView.loadUrl("file:///android_asset/index.html");
    }

    /**
     * Gets the necessary permissions (location updates).
     */
    private void getPermissions() {
        int hasFine = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION);
        int hasCoarse = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION);
        if (hasFine != PackageManager.PERMISSION_GRANTED || hasCoarse != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                this,
                new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION},
                0
            );
        }
    }

    @Override
    public void onBackPressed() {
        finish();
        provider.onDestroy();
        System.exit(0);
    }
}

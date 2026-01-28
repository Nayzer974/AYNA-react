const { withAndroidManifest, withDangerousMod, withProjectBuildGradle } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin pour intégrer les widgets natifs (Android pour l'instant)
 */
const withNativeWidgets = (config) => {
    // 1. Ajouter le récepteur dans l'AndroidManifest
    config = withAndroidManifest(config, async (config) => {
        const mainApplication = config.modResults.manifest.application[0];

        // Vérifier si le receiver existe déjà
        const receivers = mainApplication.receiver || [];
        const hasWidgetReceiver = receivers.some(
            (r) => r.$['android:name'] === 'com.ayna.app.widgets.PrayerTimesWidgetProvider'
        );

        if (!hasWidgetReceiver) {
            if (!mainApplication.receiver) mainApplication.receiver = [];

            mainApplication.receiver.push({
                $: {
                    'android:name': 'com.ayna.app.widgets.PrayerTimesWidgetProvider',
                    'android:exported': 'false',
                    'android:label': 'AYNA Heures de Prière',
                },
                'intent-filter': [
                    {
                        action: [{ $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } }],
                    },
                ],
                'meta-data': [
                    {
                        $: {
                            'android:name': 'android.appwidget.provider',
                            'android:resource': '@xml/prayer_times_widget_info',
                        },
                    },
                ],
            });
        }

        return config;
    });

    // 2. Copier les fichiers natifs et créer le module de pont
    config = withDangerousMod(config, [
        'android',
        async (config) => {
            const projectRoot = config.modRequest.projectRoot;
            const androidRoot = path.join(projectRoot, 'android');

            // Dossiers cibles
            const resXmlDir = path.join(androidRoot, 'app/src/main/res/xml');
            const resLayoutDir = path.join(androidRoot, 'app/src/main/res/layout');
            const resValuesDir = path.join(androidRoot, 'app/src/main/res/values');
            const javaDir = path.join(androidRoot, 'app/src/main/java/com/ayna/app/widgets');

            // Créer les dossiers s'ils n'existent pas
            if (!fs.existsSync(resXmlDir)) fs.mkdirSync(resXmlDir, { recursive: true });
            if (!fs.existsSync(resLayoutDir)) fs.mkdirSync(resLayoutDir, { recursive: true });
            if (!fs.existsSync(javaDir)) fs.mkdirSync(javaDir, { recursive: true });

            // Fichiers sources
            const srcDir = path.join(projectRoot, 'widgets-native/android-templates');

            // 1. Copie des fichiers templates
            if (fs.existsSync(path.join(srcDir, 'prayer_times_widget_info.xml'))) {
                fs.copyFileSync(
                    path.join(srcDir, 'prayer_times_widget_info.xml'),
                    path.join(resXmlDir, 'prayer_times_widget_info.xml')
                );
            }
            if (fs.existsSync(path.join(srcDir, 'prayer_times_widget.xml'))) {
                fs.copyFileSync(
                    path.join(srcDir, 'prayer_times_widget.xml'),
                    path.join(resLayoutDir, 'prayer_times_widget.xml')
                );
            }
            if (fs.existsSync(path.join(srcDir, 'PrayerTimesWidgetProvider.kt'))) {
                fs.copyFileSync(
                    path.join(srcDir, 'PrayerTimesWidgetProvider.kt'),
                    path.join(javaDir, 'PrayerTimesWidgetProvider.kt')
                );
            }

            // 2. Créer le module Native pour le pont (Bridge)
            // Ce module permettra à JS d'envoyer des données aux widgets
            const widgetModuleContent = `package com.ayna.app.widgets

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AynaWidgetModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "AynaWidgetModule"
    }

    @ReactMethod
    fun setWidgetData(key: String, data: String) {
        val context = reactApplicationContext
        val prefs = context.getSharedPreferences("widget_data", Context.MODE_PRIVATE)
        prefs.edit().putString(key, data).apply()

        // Notifier les widgets de la mise à jour
        val intent = Intent(context, PrayerTimesWidgetProvider::class.java)
        intent.action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
        val ids = AppWidgetManager.getInstance(context).getAppWidgetIds(ComponentName(context, PrayerTimesWidgetProvider::class.java))
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
        context.sendBroadcast(intent)
    }
}`;
            fs.writeFileSync(path.join(javaDir, 'AynaWidgetModule.kt'), widgetModuleContent);

            // 3. Créer le Package pour le module native
            const widgetPackageContent = `package com.ayna.app.widgets

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class AynaWidgetPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(AynaWidgetModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}`;
            fs.writeFileSync(path.join(javaDir, 'AynaWidgetPackage.kt'), widgetPackageContent);

            // 4. Ajouter la description dans strings.xml
            const stringsPath = path.join(resValuesDir, 'strings.xml');
            if (fs.existsSync(stringsPath)) {
                let stringsContent = fs.readFileSync(stringsPath, 'utf8');
                if (!stringsContent.includes('prayer_times_widget_description')) {
                    stringsContent = stringsContent.replace(
                        '</resources>',
                        '    <string name="prayer_times_widget_description">Affiche les heures de prière AYNA sur votre écran d\'accueil</string>\n</resources>'
                    );
                    fs.writeFileSync(stringsPath, stringsContent);
                }
            }

            return config;
        },
    ]);

    return config;
};

module.exports = withNativeWidgets;

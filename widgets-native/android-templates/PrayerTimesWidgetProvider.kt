//
// PrayerTimesWidgetProvider.kt
// Template pour le widget Android Heures de Prière
//

package com.ayna.app.widgets

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.SharedPreferences
import android.widget.RemoteViews
import org.json.JSONObject
import com.ayna.app.R

/**
 * Widget Provider pour afficher les heures de prière
 */
class PrayerTimesWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // Mettre à jour tous les widgets
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.prayer_times_widget)
        
        // Charger les données depuis SharedPreferences
        val prefs = context.getSharedPreferences("widget_data", Context.MODE_PRIVATE)
        val widgetDataJson = prefs.getString("prayer_times", null)
        
        if (widgetDataJson != null) {
            try {
                val data = JSONObject(widgetDataJson)
                val timings = data.getJSONObject("timings")
                
                // Mettre à jour les heures de prière
                views.setTextViewText(R.id.prayer_fajr_label, "Fajr")
                views.setTextViewText(R.id.prayer_fajr_time, timings.getString("Fajr"))
                
                views.setTextViewText(R.id.prayer_dhuhr_label, "Dhuhr")
                views.setTextViewText(R.id.prayer_dhuhr_time, timings.getString("Dhuhr"))
                
                views.setTextViewText(R.id.prayer_asr_label, "Asr")
                views.setTextViewText(R.id.prayer_asr_time, timings.getString("Asr"))
                
                views.setTextViewText(R.id.prayer_maghrib_label, "Maghrib")
                views.setTextViewText(R.id.prayer_maghrib_time, timings.getString("Maghrib"))
                
                views.setTextViewText(R.id.prayer_isha_label, "Isha")
                views.setTextViewText(R.id.prayer_isha_time, timings.getString("Isha"))
                
                // Prochaine prière
                if (data.has("nextPrayer")) {
                    val nextPrayer = data.getJSONObject("nextPrayer")
                    views.setTextViewText(R.id.next_prayer_label, "Prochaine prière")
                    views.setTextViewText(R.id.next_prayer_name, nextPrayer.getString("name"))
                    views.setTextViewText(R.id.next_prayer_time, nextPrayer.getString("time"))
                    views.setTextViewText(R.id.next_prayer_until, "dans ${nextPrayer.getString("timeUntil")}")
                    views.setViewVisibility(R.id.next_prayer_container, android.view.View.VISIBLE)
                } else {
                    views.setViewVisibility(R.id.next_prayer_container, android.view.View.GONE)
                }
            } catch (e: Exception) {
                e.printStackTrace()
                // Afficher un message d'erreur
                views.setTextViewText(R.id.widget_title, "Erreur de chargement")
            }
        } else {
            // Aucune donnée disponible
            views.setTextViewText(R.id.widget_title, "Aucune donnée")
        }
        
        // Mettre à jour le widget
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    override fun onReceive(context: Context, intent: android.content.Intent) {
        super.onReceive(context, intent)
        
        // Réagir aux mises à jour
        if (intent.action == AppWidgetManager.ACTION_APPWIDGET_UPDATE) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val appWidgetIds = intent.getIntArrayExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS)
            
            if (appWidgetIds != null && appWidgetIds.isNotEmpty()) {
                onUpdate(context, appWidgetManager, appWidgetIds)
            }
        }
    }

    override fun onEnabled(context: Context) {
        // Premier widget ajouté
        super.onEnabled(context)
    }

    override fun onDisabled(context: Context) {
        // Dernier widget retiré
        super.onDisabled(context)
    }

    override fun onDeleted(context: Context, appWidgetIds: IntArray) {
        // Widget supprimé
        super.onDeleted(context, appWidgetIds)
    }
}









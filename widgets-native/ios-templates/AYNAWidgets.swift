//
// AYNAWidgets.swift
// Template pour les widgets iOS
//

import WidgetKit
import SwiftUI
import Intents

// MARK: - Prayer Times Widget

struct PrayerTimesWidget: Widget {
    let kind: String = "PrayerTimesWidget"

    var body: some WidgetConfiguration {
        IntentConfiguration(
            kind: kind,
            intent: ConfigurationIntent.self,
            provider: PrayerTimesProvider()
        ) { entry in
            PrayerTimesWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Heures de Prière")
        .description("Affiche les heures de prière du jour avec la prochaine prière")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Dhikr Widget

struct DhikrWidget: Widget {
    let kind: String = "DhikrWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(
            kind: kind,
            provider: DhikrProvider()
        ) { entry in
            DhikrWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Dhikr du Jour")
        .description("Affiche le dhikr quotidien avec texte arabe et traduction")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Verse Widget

struct VerseWidget: Widget {
    let kind: String = "VerseWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(
            kind: kind,
            provider: VerseProvider()
        ) { entry in
            VerseWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Verset du Jour")
        .description("Affiche un verset du Coran avec traduction")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

// MARK: - Widget Bundle

@main
struct AYNAWidgetsBundle: WidgetBundle {
    var body: some Widget {
        PrayerTimesWidget()
        DhikrWidget()
        VerseWidget()
    }
}









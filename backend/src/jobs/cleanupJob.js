const db = require('../db');
const fs = require('fs');
const path = require('path');

/**
 * Der Cleanup-Job sucht nach Anhängen, die vor mehr als 7 Tagen als gelöscht markiert wurden.
 * Er löscht die physischen Dateien und anschließend die Datensätze aus der Datenbank.
 */
const runCleanup = () => {
    console.log('[Cleanup Job] Überprüfung auf abgelaufene Anhänge gestartet...');
    
    try {
        // Suche Anhänge, die seit mehr als 7 Tagen gelöscht sind
        const expiredAttachments = db.prepare(`
            SELECT * FROM attachments 
            WHERE deleted_at IS NOT NULL 
            AND deleted_at != ''
            AND datetime(deleted_at) < datetime('now', '-7 days')
        `).all();

        if (expiredAttachments.length === 0) {
            console.log('[Cleanup Job] Keine abgelaufenen Anhänge gefunden.');
            return;
        }

        console.log(`[Cleanup Job] ${expiredAttachments.length} abgelaufene Anhänge gefunden. Beginne Löschvorgang...`);

        for (const attachment of expiredAttachments) {
            try {
                // Physisches Löschen der Datei
                if (fs.existsSync(attachment.path)) {
                    fs.unlinkSync(attachment.path);
                    console.log(`[Cleanup Job] Datei gelöscht: ${attachment.path}`);
                }

                // Löschen des Datenbank-Eintrags
                db.prepare('DELETE FROM attachments WHERE id = ?').run(attachment.id);

                // History-Log für die endgültige Löschung
                const logStmt = db.prepare('INSERT INTO activity_logs (task_id, action, user_id, details) VALUES (?, ?, ?, ?)');
                logStmt.run(attachment.task_id, 'attachment_purged', null, `Attachment ${attachment.original_name} was permanently removed by the system.`);
                
                console.log(`[Cleanup Job] Datensatz aus DB entfernt für Anhang ID: ${attachment.id}`);
            } catch (err) {
                console.error(`[Cleanup Job] Fehler beim Löschen von Anhang ID ${attachment.id}:`, err.message);
            }
        }
    } catch (err) {
        console.error('[Cleanup Job] Kritischer Fehler im Cleanup-Job:', err.message);
    }
};

// Job alle 12 Stunden ausführen
const startCleanupJob = () => {
    // Sofortiger Start zur Prüfung beim Server-Start
    runCleanup();
    
    // Intervall: 12 Stunden (1000ms * 60s * 60m * 12h)
    setInterval(runCleanup, 12 * 60 * 60 * 1000);
};

module.exports = { startCleanupJob };

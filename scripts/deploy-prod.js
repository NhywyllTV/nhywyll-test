import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

const PROD_DOMAIN = 'nhywyll.com';
const TEST_DOMAIN = 'test.nhywyll.com';
const REMOTE_NAME = 'production';
const TEMP_BRANCH = 'release-prod-temp';

console.log('🚀 Starte Produktions-Deployment...');

// Diese Prüfung muss VOR dem try stehen: dessen finally macht `git checkout -f`,
// und das würde genau die uncommitteten Änderungen verwerfen, vor denen hier gewarnt wird.
const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();
const unstaged = status.split('\n').filter(line => !line.trim().endsWith('public/CNAME') && line.trim().length > 0);
if (unstaged.length > 0) {
    console.error(
        '❌ Uncommittete Änderungen im Arbeitsverzeichnis gefunden!\n' +
        'Nur committete Änderungen gelangen in das Produktions-Release.\n' +
        'Bitte committe oder stashe deine Änderungen zuerst.'
    );
    process.exit(1);
}

// Aktuellen Branch ermitteln, um nach dem Deployment exakt dorthin zurückzukehren
let startingBranch = 'main';
try {
    startingBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim() || 'main';
} catch {
    startingBranch = 'main';
}

try {
    // 0. Vorab aufräumen, falls ein früherer Lauf abbrach
    try {
        execSync(`git branch -D ${TEMP_BRANCH}`, { stdio: 'ignore' });
    } catch {
        // Branch existierte nicht, alles gut
    }

    // 1. In temporären Branch wechseln
    console.log('--- Erstelle temporären Branch...');
    execSync(`git checkout -b ${TEMP_BRANCH}`, { stdio: 'inherit' });

    // 2. CNAME auf Produktion ändern
    console.log(`--- Setze Domain auf ${PROD_DOMAIN}...`);
    writeFileSync('public/CNAME', PROD_DOMAIN);

    // 3. Änderungen committen
    console.log('--- Committe Änderungen...');
    execSync('git add public/CNAME', { stdio: 'inherit' });
    execSync('git commit -m "chore: release to production"', { stdio: 'inherit' });

    // 4. Zum Produktions-Repo pushen
    console.log(`--- Pushe zu ${REMOTE_NAME}...`);
    execSync(`git push ${REMOTE_NAME} ${TEMP_BRANCH}:main --force`, { stdio: 'inherit' });

    console.log('✅ Deployment erfolgreich abgeschlossen!');
} catch (error) {
    console.error('❌ Fehler beim Deployment:', error.message);
    process.exitCode = 1;
} finally {
    // 5. Zurück zum ursprünglichen Branch und Aufräumen
    console.log(`--- Räume auf und kehre zum ${startingBranch}-Stand zurück...`);
    try {
        // CNAME vor dem Wechsel zurücksetzen und sicherstellen, dass uncommittete Änderungen verworfen werden
        writeFileSync('public/CNAME', TEST_DOMAIN);
        execSync(`git checkout -f ${startingBranch}`, { stdio: 'inherit' });
        try {
            execSync(`git branch -D ${TEMP_BRANCH}`, { stdio: 'ignore' });
        } catch {
            // Branch existierte nicht oder wurde bereits entfernt
        }
        
        // CNAME sicherstellen, dass lokal wieder die Test-Domain steht
        writeFileSync('public/CNAME', TEST_DOMAIN);
        console.log('✨ Alles wieder im Test-Modus.');
    } catch (cleanupError) {
        console.error('⚠️ Fehler beim Aufräumen:', cleanupError.message);
    }
}

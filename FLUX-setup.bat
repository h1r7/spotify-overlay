<!-- :
@echo off
Title R1G3L-Flux Setup
setlocal

if "%~1"=="-launch" (
    mshta.exe "%~f0"
    exit /b
)

set "TEMP_VBS=%temp%\flux_launcher.vbs"
echo Set objShell = CreateObject("WScript.Shell") > "%TEMP_VBS%"
echo objShell.Run """%~f0"" -launch", 0, False >> "%TEMP_VBS%"
wscript.exe "%TEMP_VBS%"
del "%TEMP_VBS%"
exit /b
-->
<!DOCTYPE html>
<html>
<head>
    <title>R1G3L-Flux Setup</title>
    <meta http-equiv="x-ua-compatible" content="ie=9">
    <hta:application 
        id="oFluxSetup"
        applicationname="R1G3L-Flux Setup"
        border="thin"
        borderstyle="normal"
        caption="yes"
        maximizebutton="no"
        minimizebutton="yes"
        showintaskbar="yes"
        singleinstance="yes"
        sysmenu="yes"
        version="1.4"
        windowstate="normal"
        scroll="no"
    />
    <style>
        body {
            font-family: Segoe UI, Tahoma, sans-serif;
            background-color: #fff;
            margin: 0;
            padding: 0;
            color: #333;
        }
        .header {
            background-color: #0078d4;
            padding: 24px 20px;
            text-align: center;
        }
        .header h1 {
            font-size: 28px;
            margin: 0 0 4px 0;
            letter-spacing: 6px;
            font-weight: 300;
            color: #fff;
        }
        .header p {
            margin: 0;
            font-size: 11px;
            color: #b0d4f1;
        }
        .content {
            padding: 18px 22px;
        }
        .footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 12px 22px;
            background-color: #f3f3f3;
            border-top: 1px solid #ddd;
            text-align: right;
        }
        .btn {
            padding: 9px 24px;
            font-size: 13px;
            border-radius: 2px;
            cursor: pointer;
            border: 1px solid #aaa;
            background-color: #eee;
            margin-left: 8px;
        }
        .btn-primary {
            background-color: #0078d4;
            color: #fff;
            border-color: #0078d4;
        }
        .btn-hidden { display: none; }
        .status-box {
            font-family: Consolas, monospace;
            font-size: 10px;
            background-color: #1a1a1a;
            color: #aaa;
            padding: 8px;
            height: 70px;
            overflow-y: auto;
            border: 1px solid #333;
            margin-top: 10px;
        }
        .hidden { display: none; }
        .mode-btn {
            text-align: left;
            padding: 14px 16px;
            border: 1px solid #ddd;
            margin-bottom: 8px;
            cursor: pointer;
            background-color: #fafafa;
        }
        .mode-btn-danger { border-color: #e8c0c0; }
        .mode-title { font-weight: bold; font-size: 13px; display: block; margin-bottom: 2px; color: #222; }
        .mode-title-danger { color: #b00; }
        .mode-desc { font-size: 10px; color: #666; }
        .success-text { color: #060; }
        .error-text { color: #900; }

        .progress-wrap {
            background-color: #ddd;
            height: 18px;
            margin: 10px 0;
            border: 1px solid #bbb;
            position: relative;
            overflow: hidden;
        }
        .progress-fill {
            background-color: #0078d4;
            height: 100%;
            width: 0%;
            transition: width 0.3s;
        }
        .progress-label {
            text-align: center;
            font-size: 11px;
            color: #555;
            margin-top: 3px;
        }
    </style>
</head>
<body onload="init()">
    <div id="step-action">
        <div class="header">
            <h1>FLUX</h1>
            <p>Spotify Overlay by R1G3L</p>
        </div>
        <div class="content">
            <div id="option-install" class="mode-btn" onclick="startProcess('install')" style="display:none;">
                <span class="mode-title">Get Started</span>
                <span class="mode-desc">Download FLUX and configure Spotify integration.</span>
            </div>
            <div id="option-update" class="mode-btn" onclick="startProcess('update')" style="display:none;">
                <span class="mode-title">Update FLUX</span>
                <span class="mode-desc">Update to the latest version.</span>
            </div>
            <div id="option-setup" class="mode-btn" onclick="startProcess('setup')" style="display:none;">
                <span class="mode-title">Repair Integration</span>
                <span class="mode-desc">Re-configure Spotify integration only.</span>
            </div>
            <div id="option-uninstall" class="mode-btn mode-btn-danger" onclick="startProcess('uninstall')">
                <span class="mode-title mode-title-danger">Uninstall</span>
                <span class="mode-desc">Remove FLUX and clean up files.</span>
            </div>
        </div>
        <div class="footer">
            <button class="btn" onclick="closeApp()">Exit</button>
        </div>
    </div>

    <div id="step-progress" class="hidden">
        <div class="header">
            <h1>FLUX</h1>
            <p id="progressSubtitle">Processing...</p>
        </div>
        <div class="content">
            <div id="statusText" style="font-size: 13px; font-weight: bold; margin-bottom: 6px;">Initializing...</div>
            <div class="progress-wrap">
                <div class="progress-fill" id="progressBar"></div>
            </div>
            <div class="progress-label" id="progressPercent">0%</div>
            <div id="statusBox" class="status-box"></div>
        </div>
        <div class="footer">
            <button class="btn btn-primary btn-hidden" id="btnDone" onclick="closeApp()">Done</button>
        </div>
    </div>

    <script type="text/javascript">
        var shell = new ActiveXObject("WScript.Shell");
        var fso = new ActiveXObject("Scripting.FileSystemObject");
        var exeName = "FLUX.exe";
        var repoUrl = "https://github.com/h1r7/spotify-overlay/releases/latest/download/FLUX.exe";
        var downloadTimer = null;

        function init() {
            window.resizeTo(460, 420);
            var x = (screen.width - 460) / 2;
            var y = (screen.height - 420) / 2;
            window.moveTo(x, y);
            checkPresence();
        }

        function checkPresence() {
            var exists = fso.FileExists(exeName);
            document.getElementById('option-install').style.display = exists ? "none" : "block";
            document.getElementById('option-update').style.display = exists ? "block" : "none";
            document.getElementById('option-setup').style.display = exists ? "block" : "none";
        }

        function showStep(id) {
            document.getElementById('step-action').style.display = "none";
            document.getElementById('step-progress').style.display = "none";
            document.getElementById(id).style.display = "block";
        }

        function setProgress(percent, text) {
            document.getElementById('progressBar').style.width = percent + "%";
            document.getElementById('progressPercent').innerText = percent + "%";
            if (text) document.getElementById('statusText').innerText = text;
        }

        function animateDownload(startPct, endPct, callback) {
            var current = startPct;
            downloadTimer = window.setInterval(function() {
                if (current < endPct) {
                    current += 1;
                    setProgress(current, "Downloading from GitHub...");
                }
            }, 150);
            
            // Actual download in background
            var psScript = "$ProgressPreference = 'SilentlyContinue'; [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; try { Invoke-WebRequest -Uri '" + repoUrl + "' -OutFile '" + exeName + "' -ErrorAction Stop; exit 0 } catch { exit 1 }";
            var ret = shell.Run("powershell -Command \"" + psScript + "\"", 0, true);
            
            window.clearInterval(downloadTimer);
            callback(ret === 0);
        }

        function log(msg, type) {
            var box = document.getElementById('statusBox');
            var span = document.createElement('span');
            if (type === 'success') span.className = 'success-text';
            else if (type === 'error') span.className = 'error-text';
            span.innerText = msg;
            box.appendChild(span);
            box.appendChild(document.createElement('br'));
            box.scrollTop = box.scrollHeight;
        }

        function closeApp() { window.close(); }

        function showDoneButton() {
            document.getElementById('btnDone').className = "btn btn-primary";
        }

        function startProcess(mode) {
            showStep('step-progress');
            var subtitles = { 'install': 'Installing...', 'update': 'Updating...', 'setup': 'Configuring...', 'uninstall': 'Uninstalling...' };
            document.getElementById('progressSubtitle').innerText = subtitles[mode];
            setProgress(0, "Starting...");
            document.getElementById('statusBox').innerHTML = "";
            
            window.setTimeout(function() {
                if (mode === 'install' || mode === 'update') runInstallUpdate(mode);
                else if (mode === 'setup') runOnlySetup();
                else runUninstall();
            }, 200);
        }

        function runInstallUpdate(mode) {
            log("[1/3] Preparing " + (mode === 'update' ? "update" : "installation") + "...");
            setProgress(5, "Preparing...");

            if (mode === 'update') {
                shell.Run("taskkill /F /IM " + exeName, 0, true);
                if (fso.FileExists(exeName + ".old")) fso.DeleteFile(exeName + ".old");
                if (fso.FileExists(exeName)) fso.MoveFile(exeName, exeName + ".old");
                log(" - Backed up existing file.");
            }
            
            log("[2/3] Downloading FLUX.exe...");
            
            animateDownload(10, 55, function(success) {
                if (!success) {
                    setProgress(100, "Download Failed!");
                    log("[Error] Could not download from GitHub.", "error");
                    if (fso.FileExists(exeName + ".old")) fso.MoveFile(exeName + ".old", exeName);
                    showDoneButton();
                    return;
                }
                
                setProgress(60, "Download complete!");
                log(" - Download successful.");

                setProgress(70, "Configuring Spicetify...");
                log("[3/3] Running Spicetify integration...");
                shell.Run(exeName + " --install", 0, true);
                
                if (fso.FileExists(exeName + ".old")) fso.DeleteFile(exeName + ".old");

                setProgress(100, "Installation Complete!");
                log("");
                log("FLUX is ready to use!", "success");
                showDoneButton();
            });
        }

        function runOnlySetup() {
            setProgress(30, "Re-configuring integration...");
            log("[1/1] Running Spicetify setup...");
            var ret = shell.Run(exeName + " --install", 0, true);
            if (ret === 0) {
                setProgress(100, "Configuration Complete!");
                log(" - Applied successfully.", "success");
            } else {
                setProgress(100, "Setup Failed");
                log("[Error] Check Spicetify installation.", "error");
            }
            showDoneButton();
        }

        function runUninstall() {
            setProgress(15, "Stopping processes...");
            log("[1/3] Terminating FLUX.exe...");
            shell.Run("taskkill /F /IM " + exeName, 0, true);
            
            setProgress(45, "Cleaning up files...");
            log("[2/3] Removing Spicetify extension...");
            var appData = shell.ExpandEnvironmentStrings("%APPDATA%");
            var extPath = appData + "\\spicetify\\Extensions\\obs-bridge.js";
            if (fso.FileExists(extPath)) {
                fso.DeleteFile(extPath);
                log(" - Removed: obs-bridge.js");
            }
            shell.Run("powershell -Command \"spicetify config extensions obs-bridge.js-; spicetify apply\"", 0, true);

            setProgress(80, "Deleting executable...");
            log("[3/3] Removing FLUX.exe...");
            if (fso.FileExists(exeName)) fso.DeleteFile(exeName);
            log(" - Removed: " + exeName);

            setProgress(100, "Uninstall Complete!");
            log("");
            log("All files removed.", "success");
            showDoneButton();
        }
    </script>
</body>
</html>

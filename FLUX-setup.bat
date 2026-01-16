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
        version="1.5"
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
            padding: 22px 20px;
            text-align: center;
        }
        .header h1 {
            font-size: 26px;
            margin: 0 0 3px 0;
            letter-spacing: 5px;
            font-weight: 300;
            color: #fff;
        }
        .header p {
            margin: 0;
            font-size: 10px;
            color: #a8d4f5;
        }
        .content {
            padding: 16px 20px;
            overflow-y: auto;
            max-height: 380px; /* Leave space for header and footer */
            padding-bottom: 60px; /* Prevent content from being hidden behind footer */
        }
        .footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 10px 20px;
            background-color: #f3f3f3;
            border-top: 1px solid #ddd;
            text-align: right;
        }
        .btn {
            padding: 8px 22px;
            font-size: 12px;
            border-radius: 2px;
            cursor: pointer;
            border: 1px solid #999;
            background-color: #eee;
            margin-left: 6px;
        }
        .btn-primary {
            background-color: #0078d4;
            color: #fff;
            border-color: #0078d4;
        }
        .btn-hidden { display: none; }
        .log-box {
            font-family: Consolas, monospace;
            font-size: 9px;
            background-color: #1a1a1a;
            color: #999;
            padding: 6px;
            height: 55px;
            overflow-y: auto;
            border: 1px solid #333;
            margin-top: 8px;
        }
        .hidden { display: none; }
        .menu-item {
            padding: 12px 14px;
            border: 1px solid #ddd;
            margin-bottom: 6px;
            cursor: pointer;
            background-color: #fafafa;
        }
        .menu-item:hover { background-color: #f0f7ff; border-color: #0078d4; }
        .menu-danger { border-color: #e8c0c0; }
        .menu-danger:hover { background-color: #fff5f5; border-color: #c00; }
        .menu-title { font-weight: bold; font-size: 12px; display: block; margin-bottom: 1px; color: #222; }
        .menu-title-danger { color: #a00; }
        .menu-desc { font-size: 9px; color: #666; }
        .ok { color: #080; }
        .err { color: #800; }

        .prog-wrap {
            background-color: #ddd;
            height: 16px;
            margin: 8px 0;
            border: 1px solid #bbb;
        }
        .prog-bar {
            background-color: #0078d4;
            height: 100%;
            width: 0%;
        }
        .prog-text {
            text-align: center;
            font-size: 10px;
            color: #555;
            margin-top: 2px;
        }
    </style>
</head>
<body onload="init()">
    <div id="view-menu">
        <div class="header">
            <h1>FLUX</h1>
            <p>Spotify Overlay by R1G3L</p>
        </div>
        <div class="content">
            <div id="opt-install" class="menu-item" onclick="run('install')" style="display:none;">
                <span class="menu-title">Get Started</span>
                <span class="menu-desc">Download and configure FLUX.</span>
            </div>
            <div id="opt-update" class="menu-item" onclick="run('update')" style="display:none;">
                <span class="menu-title">Update FLUX</span>
                <span class="menu-desc">Download the latest version.</span>
            </div>
            <div id="opt-repair" class="menu-item" onclick="run('repair')" style="display:none;">
                <span class="menu-title">Repair</span>
                <span class="menu-desc">Re-apply Spotify integration.</span>
            </div>
            <div id="opt-remove" class="menu-item menu-danger" onclick="run('remove')">
                <span class="menu-title menu-title-danger">Uninstall</span>
                <span class="menu-desc">Remove FLUX completely.</span>
            </div>
        </div>
        <div class="footer">
            <button class="btn" onclick="closeApp()">Exit</button>
        </div>
    </div>

    <div id="view-progress" class="hidden">
        <div class="header">
            <h1>FLUX</h1>
            <p id="sub">Working...</p>
        </div>
        <div class="content">
            <div id="status" style="font-size: 12px; font-weight: bold; margin-bottom: 4px;">Starting...</div>
            <div class="prog-wrap">
                <div class="prog-bar" id="bar"></div>
            </div>
            <div class="prog-text" id="pct">0%</div>
            <div id="logbox" class="log-box"></div>
        </div>
        <div class="footer">
            <button class="btn btn-primary btn-hidden" id="btnDone" onclick="closeApp()">Done</button>
        </div>
    </div>

    <script type="text/javascript">
        var sh = new ActiveXObject("WScript.Shell");
        var fso = new ActiveXObject("Scripting.FileSystemObject");
        var xhr = new ActiveXObject("MSXML2.XMLHTTP");
        var stream = new ActiveXObject("ADODB.Stream");
        var exe = "FLUX.exe";
        var url = "https://github.com/h1r7/spotify-overlay/releases/latest/download/FLUX.exe";
        var expectedSize = 130000000; // ~130MB fallback

        function init() {
            window.resizeTo(420, 500);
            window.moveTo((screen.width - 420) / 2, (screen.height - 500) / 2);
            refresh();
        }

        function refresh() {
            var exists = fso.FileExists(exe);
            document.getElementById('opt-install').style.display = exists ? "none" : "block";
            document.getElementById('opt-update').style.display = exists ? "block" : "none";
            document.getElementById('opt-repair').style.display = exists ? "block" : "none";
        }

        function show(id) {
            document.getElementById('view-menu').style.display = "none";
            document.getElementById('view-progress').style.display = "none";
            document.getElementById(id).style.display = "block";
        }

        function prog(p, t) {
            document.getElementById('bar').style.width = p + "%";
            document.getElementById('pct').innerText = p + "%";
            if (t) document.getElementById('status').innerText = t;
        }

        function log(m, c) {
            var b = document.getElementById('logbox');
            var s = document.createElement('span');
            if (c) s.className = c;
            s.innerText = m;
            b.appendChild(s);
            b.appendChild(document.createElement('br'));
            b.scrollTop = b.scrollHeight;
        }

        function done() {
            document.getElementById('btnDone').className = "btn btn-primary";
        }

        function closeApp() { window.close(); }

        function run(mode) {
            show('view-progress');
            var titles = { install: 'Installing...', update: 'Updating...', repair: 'Repairing...', remove: 'Removing...' };
            document.getElementById('sub').innerText = titles[mode];
            document.getElementById('logbox').innerHTML = "";
            prog(0, "Starting...");

            window.setTimeout(function() {
                if (mode === 'install' || mode === 'update') doDownload(mode);
                else if (mode === 'repair') doRepair();
                else doRemove();
            }, 100);
        }

        function doDownload(mode) {
            log("[1/3] Preparing...");
            prog(2, "Preparing...");

            if (mode === 'update') {
                sh.Run("taskkill /F /IM " + exe, 0, true);
                if (fso.FileExists(exe + ".bak")) fso.DeleteFile(exe + ".bak");
                if (fso.FileExists(exe)) fso.MoveFile(exe, exe + ".bak");
                log(" - Backed up old file.");
            }

            log("[2/3] Downloading from GitHub...");
            prog(5, "Connecting to GitHub...");

            try {
                xhr.open("GET", url, false);
                xhr.send();
                
                if (xhr.status !== 200) {
                    throw new Error("HTTP " + xhr.status);
                }

                prog(10, "Downloading...");
                
                var total = expectedSize;
                try {
                    var cl = xhr.getResponseHeader("Content-Length");
                    if (cl) total = parseInt(cl, 10);
                } catch(e) {}

                stream.Type = 1;
                stream.Open();
                stream.Write(xhr.responseBody);
                stream.SaveToFile(exe, 2);
                stream.Close();

                var actualSize = fso.GetFile(exe).Size;
                var pct = Math.min(Math.round((actualSize / total) * 50) + 10, 60);
                prog(pct, "Download complete!");
                log(" - Downloaded " + Math.round(actualSize / 1024 / 1024) + " MB.");
            } catch(e) {
                prog(100, "Download Failed!");
                log("[Error] " + e.message, "err");
                if (fso.FileExists(exe + ".bak")) fso.MoveFile(exe + ".bak", exe);
                done();
                return;
            }

            if (fso.FileExists(exe + ".bak")) {
                try { fso.DeleteFile(exe + ".bak"); } catch(e) {}
            }

            prog(70, "Configuring Spicetify...");
            log("[3/3] Applying integration...");
            sh.Run(exe + " --install", 0, true);

            prog(100, "Complete!");
            log("");
            log("FLUX is ready!", "ok");
            done();
        }

        function doRepair() {
            prog(30, "Re-configuring...");
            log("[1/1] Running Spicetify setup...");
            sh.Run(exe + " --install", 0, true);
            prog(100, "Repair Complete!");
            log(" - Done.", "ok");
            done();
        }

        function doRemove() {
            prog(10, "Stopping...");
            log("[1/3] Stopping FLUX...");
            sh.Run("taskkill /F /IM " + exe, 0, true);

            prog(40, "Cleaning...");
            log("[2/3] Removing extension...");
            var ext = sh.ExpandEnvironmentStrings("%APPDATA%") + "\\spicetify\\Extensions\\obs-bridge.js";
            if (fso.FileExists(ext)) {
                fso.DeleteFile(ext);
                log(" - Removed obs-bridge.js");
            }
            sh.Run("powershell -Command \"spicetify config extensions obs-bridge.js-; spicetify apply\"", 0, true);

            prog(80, "Deleting...");
            log("[3/3] Deleting executable...");
            if (fso.FileExists(exe)) fso.DeleteFile(exe);
            log(" - Removed " + exe);

            prog(100, "Uninstalled!");
            log("");
            log("All files removed.", "ok");
            done();
        }
    </script>
</body>
</html>

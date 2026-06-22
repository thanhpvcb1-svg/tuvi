Set shell = CreateObject("WScript.Shell")
shell.CurrentDirectory = "C:\project\tuvi"
shell.Run "cmd.exe /k ""cd /d C:\project\tuvi && run-local.cmd""", 1, False

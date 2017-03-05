@echo off
set extDir=""
set packer="%~dp0..\WinScripts\batch\ExtensionPacker.bat"

if "%1" neq "" set extDir=%1

if not exist %extDir% (
  set extDir="UrlEditorPRO\UrlEditorPRO\app"
)


if not exist %extDir% (
  goto error
)

if not exist %packer% (
  echo Packer not found %packer%
  goto :eof
)

%packer% %extDir%

goto :eof

:error
echo Extension directory not found:
echo %extDir%, %1
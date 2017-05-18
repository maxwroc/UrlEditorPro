@echo off
set extDir=""
set packer="%~dp0..\WinScripts\batch\ExtensionPacker.bat"

if "%1" neq "" set extDir=%1

if not exist %extDir% (
  set extDir="UrlEditorPRO\app"
)


if not exist %extDir% (
  echo Extension directory not found:
  echo %extDir%, %1
  exit /b
)

if not exist %packer% (
  echo Packer not found %packer%
  exit /b
)

%packer% %extDir%
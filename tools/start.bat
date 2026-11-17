@echo off
cd /d "%~dp0.."
py tools\serve.py 8080 || python tools\serve.py 8080

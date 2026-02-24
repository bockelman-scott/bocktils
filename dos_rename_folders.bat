@echo off
setlocal enabledelayedexpansion

REM Iterate through all directories that contain " - "
FOR /D %%i IN ("* - *") DO (
    set "oldname=%%i"
    
    REM Store the original full path for clarity if needed, though not strictly required by MOVE in same dir.
    REM set "original_full_path=!cd!\!oldname!"

    REM Step 1: Replace " - " (space-hyphen-space) with a single underscore "_"
    set "newname=!oldname: - =_!"
    
    REM Step 2: Replace any remaining single spaces " " with underscores "_"
    set "newname=!newname: =_!"
    
    REM Check if a change actually occurred before attempting to rename
    if not "!oldname!"=="!newname!" (
        REM IMPORTANT: Check if the target name already exists (as a file or folder)
        REM This prevents "move" from trying to move a directory INTO an existing directory of the same name.
        if exist "!newname!" (
            echo SKIPPING: Target name "!newname!" already exists. Please resolve manually if this is a conflict.
        ) else (
            echo Renaming: "!oldname!"  -->  "!newname!"
            REM Use MOVE command to rename the directory
            move "!oldname!" "!newname!"
        )
    ) else (
        echo No change needed for: "!oldname!"
    )
)

echo.
echo Rename process complete.
endlocal
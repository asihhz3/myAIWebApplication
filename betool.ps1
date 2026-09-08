
param(
    [string]$Task
)


switch ($Task) {
    'clean' { rm -Force '.\backend\data\*' }
    default { echo 'unknown command' }
}
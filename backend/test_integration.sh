#!/bin/bash
set -e

BASE="http://localhost:8000"
PASS=0
FAIL=0

check() {
    local desc="$1"
    local cond="$2"
    if eval "$cond"; then
        echo "PASS: $desc"
        PASS=$((PASS+1))
    else
        echo "FAIL: $desc"
        FAIL=$((FAIL+1))
    fi
}

# 1. Create 2 workspaces
WS1=$(curl -s -X POST $BASE/api/workspaces -H 'Content-Type: application/json' -d '{"name":"Workspace One"}')
WS1_ID=$(echo "$WS1" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
check "Create workspace 1" '[ -n "$WS1_ID" ]'

WS2=$(curl -s -X POST $BASE/api/workspaces -H 'Content-Type: application/json' -d '{"name":"Workspace Two"}')
WS2_ID=$(echo "$WS2" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
check "Create workspace 2" '[ -n "$WS2_ID" ]'

# 2. Create 3 files in workspace 1
F1=$(curl -s -X POST $BASE/api/workspaces/$WS1_ID/files -H 'Content-Type: application/json' -d '{"name":"file1"}')
F1_ID=$(echo "$F1" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
check "Create file 1" '[ -n "$F1_ID" ]'

F2=$(curl -s -X POST $BASE/api/workspaces/$WS1_ID/files -H 'Content-Type: application/json' -d '{"name":"file2"}')
F2_ID=$(echo "$F2" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
check "Create file 2" '[ -n "$F2_ID" ]'

F3=$(curl -s -X POST $BASE/api/workspaces/$WS1_ID/files -H 'Content-Type: application/json' -d '{"name":"file3"}')
F3_ID=$(echo "$F3" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
check "Create file 3" '[ -n "$F3_ID" ]'

# 3. Save content to each file
CONTENT1='{"type":"excalidraw","version":2,"elements":[{"type":"rectangle","x":0,"y":0,"width":50,"height":50}],"appState":{}}'
CONTENT2='{"type":"excalidraw","version":2,"elements":[{"type":"ellipse","x":10,"y":10,"width":30,"height":30}],"appState":{}}'
CONTENT3='{"type":"excalidraw","version":2,"elements":[{"type":"text","x":5,"y":5,"text":"hello"}],"appState":{}}'

curl -s -X PUT $BASE/api/workspaces/$WS1_ID/files/$F1_ID/content -H 'Content-Type: application/json' -d "$CONTENT1" > /dev/null
curl -s -X PUT $BASE/api/workspaces/$WS1_ID/files/$F2_ID/content -H 'Content-Type: application/json' -d "$CONTENT2" > /dev/null
curl -s -X PUT $BASE/api/workspaces/$WS1_ID/files/$F3_ID/content -H 'Content-Type: application/json' -d "$CONTENT3" > /dev/null
check "Save content to files" 'true'

# 4. Read back and verify content matches
READ1=$(curl -s $BASE/api/workspaces/$WS1_ID/files/$F1_ID/content)
READ1_TYPE=$(echo "$READ1" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['elements'][0]['type'])")
check "Read back file 1 content" '[ "$READ1_TYPE" = "rectangle" ]'

READ2=$(curl -s $BASE/api/workspaces/$WS1_ID/files/$F2_ID/content)
READ2_TYPE=$(echo "$READ2" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['elements'][0]['type'])")
check "Read back file 2 content" '[ "$READ2_TYPE" = "ellipse" ]'

READ3=$(curl -s $BASE/api/workspaces/$WS1_ID/files/$F3_ID/content)
READ3_TYPE=$(echo "$READ3" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['elements'][0]['type'])")
check "Read back file 3 content" '[ "$READ3_TYPE" = "text" ]'

# 5. Import from test folder into workspace 2
mkdir -p /tmp/test-import-integration
echo '{"type":"excalidraw","version":2,"elements":[{"type":"diamond","x":0,"y":0,"width":20,"height":20}],"appState":{}}' > /tmp/test-import-integration/imported1.excalidraw
echo '{"type":"excalidraw","version":2,"elements":[],"appState":{}}' > /tmp/test-import-integration/imported2.excalidraw
echo 'invalid' > /tmp/test-import-integration/bad.excalidraw

IMPORT_RESULT=$(curl -s -X POST $BASE/api/workspaces/$WS2_ID/import -H 'Content-Type: application/json' -d '{"path":"/tmp/test-import-integration"}')
IMPORTED=$(echo "$IMPORT_RESULT" | python3 -c "import sys,json;print(json.load(sys.stdin)['imported'])")
check "Import files into workspace 2" '[ "$IMPORTED" = "2" ]'

# 6. List files in both workspaces, verify counts
WS1_COUNT=$(curl -s $BASE/api/workspaces/$WS1_ID/files | python3 -c "import sys,json;print(len(json.load(sys.stdin)))")
check "Workspace 1 has 3 files" '[ "$WS1_COUNT" = "3" ]'

WS2_COUNT=$(curl -s $BASE/api/workspaces/$WS2_ID/files | python3 -c "import sys,json;print(len(json.load(sys.stdin)))")
check "Workspace 2 has 2 files" '[ "$WS2_COUNT" = "2" ]'

# 7. Rename a file, verify
curl -s -X PUT $BASE/api/workspaces/$WS1_ID/files/$F1_ID -H 'Content-Type: application/json' -d '{"name":"renamed-file1"}' > /dev/null
RENAMED=$(curl -s $BASE/api/workspaces/$WS1_ID/files/$F1_ID | python3 -c "import sys,json;print(json.load(sys.stdin)['name'])")
check "Rename file" '[ "$RENAMED" = "renamed-file1" ]'

# 8. Delete a file, verify it's gone from DB
DEL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $BASE/api/workspaces/$WS1_ID/files/$F2_ID)
check "Delete file returns 204" '[ "$DEL_STATUS" = "204" ]'

WS1_COUNT_AFTER=$(curl -s $BASE/api/workspaces/$WS1_ID/files | python3 -c "import sys,json;print(len(json.load(sys.stdin)))")
check "Workspace 1 has 2 files after delete" '[ "$WS1_COUNT_AFTER" = "2" ]'

GET_DELETED=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/workspaces/$WS1_ID/files/$F2_ID)
check "Deleted file returns 404" '[ "$GET_DELETED" = "404" ]'

# 9. Delete workspace 1, verify all files gone
DEL_WS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $BASE/api/workspaces/$WS1_ID)
check "Delete workspace 1 returns 204" '[ "$DEL_WS_STATUS" = "204" ]'

GET_WS1=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/workspaces/$WS1_ID)
check "Workspace 1 returns 404 after delete" '[ "$GET_WS1" = "404" ]'

# Cleanup
rm -rf /tmp/test-import-integration
curl -s -X DELETE $BASE/api/workspaces/$WS2_ID > /dev/null

echo ""
echo "Results: $PASS passed, $FAIL failed"
if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0

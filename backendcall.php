<?php 
    if($_GET['action'] == 'delete') {
        setcookie("test-httponly", "test data", time() - 3600, "/", "", true, true);
    }
    else {
        setcookie("test-httponly", "test data", time() + 3600, "/", "", true, true);
    }
?>
{
    "ok": "ok"
}
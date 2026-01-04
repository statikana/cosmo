/* filling table */

fetch("/cosmo/data.json?t=" + Date.now()) // force refresh
    .then(response => response.json())
    .then(
        function(json) {
            console.log("json", json);
            var new_tbody = document.createElement("tbody");
            new_tbody.setAttribute("id", "file-table-body");

            for (var filename_str in json){
                const entry = json[filename_str];

                var row = document.createElement("tr");
                row.classList.add("file-table-row");

                var filename = document.createElement("td");
                const lim = navigator.platform === "iPhone"? 25 : 60;
                if (filename_str.length > lim) {
                    filename.textContent = filename_str.substr(0,  lim) + "...";
                } else {
                    filename.textContent = filename_str;
                }

                var size = document.createElement("td");
                size.textContent = fmtsize(entry["size"]);

                var ip = document.createElement("td");
                ip.textContent = entry["ip"];

                var time = document.createElement("td");

                var date = new Date(entry["time"].toString() * 1000);
                var hours = date.getHours();
                var minutes = "0" + date.getMinutes();
                var seconds = "0" + date.getSeconds();
                var formatted_time = date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate() + " " + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

                time.textContent = formatted_time;
                
                var download = document.createElement("td");
                var btn = document.createElement("button");
                btn.classList.add("file-download");
                btn.textContent = "+";
                btn.addEventListener("click", async function() {
                    try {
                        const resp = await fetch("/cosmo/media/" + encodeURIComponent(filename_str), { cache: "no-store" });
                        if (!resp.ok) throw new Error("Network response was not ok");
                        const blob = await resp.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.style.display = "none";
                        a.href = blobUrl;
                        a.download = filename_str;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(blobUrl);
                    } catch (err) {
                        console.error("Download failed:", err);
                        // optionally show an error to the user
                    }
                });
                download.appendChild(btn);

                var del = document.createElement("td");
                var del_button = document.createElement("button");
                del_button.classList.add("file-download");
                del_button.textContent = "-";
                del_button.addEventListener("click", async function() {
                    await fetch("/cosmo/delete?filenames=" + encodeURIComponent(filename_str), { method: "POST" })
                        .then(function(resp) {
                            console.log(resp.url);
                            if (resp.ok) {
                                row.remove();
                            } else {
                                console.error("Delete failed:", resp.status);
                            }
                        })
                        .catch(function(err) { console.error("Delete error:", err); });
                });
                del.appendChild(del_button);

                row.appendChild(filename);
                row.appendChild(size);
                row.appendChild(ip);
                row.appendChild(time);
                row.appendChild(download);
                row.appendChild(del);
                console.log(filename, size, ip, time);

                new_tbody.appendChild(row);
            }
            
            var old_tbody = document.getElementById("file-table-body");
            old_tbody.replaceWith(new_tbody);
        }

    )

/* sorting table */
function sortby(tr_acc, reverse) {
    const file_table = document.getElementById("file-table");
    var rows = document.getElementsByClassName("file-table-row");
    var arr = Array.from(rows);
    arr.sort((a, b) => ((tr_acc(a) > tr_acc(b)) ? (reverse? 1:-1) : (reverse? -1:1)));
    for (const n of arr) {
        file_table.appendChild(n);
    }
}

function fmtsize(num) {
    console.log(num);
    for (var unit of ["", "Ki", "Mi", "Gi", "Ti", "Pi", "Ei", "Zi"]) {
        if (Math.abs(num) < 1024.0) {
            return Math.round(num*10**2)/10**2 + " " + unit + "B";
        }
        num /= 1024.0;
    }
    return num + " YiB";
}

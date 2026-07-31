#!/usr/bin/env python3
# 部署 Cloudflare Worker + KV 计数后端。
# 需要环境变量: CF_API_TOKEN (具有 Workers Scripts:Edit + Workers KV Storage:Edit 权限的令牌)
#                CF_ACCOUNT_ID (Cloudflare 账户 ID)
# 可选: CF_SUBDOMAIN (workers.dev 子域，未设置则尝试保留现有)
# 用法: CF_API_TOKEN=xxx CF_ACCOUNT_ID=xxx python3 deploy_worker.py
import os, sys, json, urllib.request, urllib.error

API = "https://api.cloudflare.com/client/v4"
ACCOUNT = os.environ["CF_ACCOUNT_ID"]
TOKEN = os.environ["CF_API_TOKEN"]
SCRIPT = "outlast-visitors"
KV_TITLE = "outlast-visitors-kv"

def api(method, path, body=None, headers=None, raw=False):
    url = f"{API}{path}"
    req = urllib.request.Request(url, method=method)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    h = headers or {}
    for k, v in h.items():
        req.add_header(k, v)
    if body is not None:
        if isinstance(body, bytes):
            req.data = body
        else:
            req.data = body.encode("utf-8")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, r.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8")

# 1) 设置 workers.dev 子域（best-effort）
sub = os.environ.get("CF_SUBDOMAIN")
if sub:
    st, _ = api("PUT", f"/accounts/{ACCOUNT}/workers/subdomain",
                json.dumps({"subdomain": sub}), {"Content-Type": "application/json"})
    print("set subdomain:", st)

# 2) 创建 KV 命名空间（若已存在则复用）
kv_id = None
st, resp = api("GET", f"/accounts/{ACCOUNT}/storage/kv/namespaces")
if st == 200:
    for ns in json.loads(resp)["result"]:
        if ns["title"] == KV_TITLE:
            kv_id = ns["id"]
            print("复用 KV:", kv_id)
if not kv_id:
    st, resp = api("POST", f"/accounts/{ACCOUNT}/storage/kv/namespaces",
                    json.dumps({"title": KV_TITLE}), {"Content-Type": "application/json"})
    kv_id = json.loads(resp)["result"]["id"]
    print("新建 KV:", kv_id)

# 3) 上传 Worker（multipart: 代码 + 元数据含 KV 绑定）
code = open(os.path.join(os.path.dirname(__file__), "visitor-counter.js"), "rb").read()
metadata = json.dumps({
    "main_module": "visitor-counter.js",
    "bindings": [{"type": "kv_ns", "name": "VIEWS", "namespace_id": kv_id}],
}).encode("utf-8")

boundary = "----cfworkerboundary"
body = b""
body += f"--{boundary}\r\n".encode()
body += b'Content-Disposition: form-data; name="metadata"\r\n'
body += b"Content-Type: application/json\r\n\r\n"
body += metadata + b"\r\n"
body += f"--{boundary}\r\n".encode()
body += b'Content-Disposition: form-data; name="visitor-counter.js"; filename="visitor-counter.js"\r\n'
body += b"Content-Type: application/javascript\r\n\r\n"
body += code + b"\r\n"
body += f"--{boundary}--\r\n".encode()

st, resp = api("PUT", f"/accounts/{ACCOUNT}/workers/scripts/{SCRIPT}",
               body, {"Content-Type": f"multipart/form-data; boundary={boundary}"})
print("upload worker:", st)
if st != 200:
    print(resp)
    sys.exit(1)

# 4) 输出访问地址
sub_resp = api("GET", f"/accounts/{ACCOUNT}/workers/subdomain")[1]
subdomain = json.loads(sub_resp)["result"]["subdomain"]
base = f"https://{SCRIPT}.{subdomain}.workers.dev"
print("WORKER_BASE=", base)
print("STATS_URL  =", base + "/stats?days=30")
print("TRACK_URL  =", base + "/track")

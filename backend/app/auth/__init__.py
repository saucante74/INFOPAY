"""
Single-account authentication, kept out of the business code.

It is wired in exactly two places in `app/main.py`: the login router is
included, and `require_auth` is passed as a router-level dependency to the
protected routers. No business route, service or model imports this package,
so removing authentication means deleting it and those two lines.
"""

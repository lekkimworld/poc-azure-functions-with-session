# poc-azure-functions-with-session #
Simple proof-of-concept for an Azure Function in node that returns an incremented counter stored in the users session. The session store is Redis. Be sure to create an Azure Redis Cache and set the following application configuration settings:
* `redis_host` (host name to Azure Redis Cache)
* `redis_authpass` (key to use Redis Cache)

The above may be set in `local.settings.json"` for local appdev.
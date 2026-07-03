import asyncio
import os
import sys

worker_type = os.getenv("WORKER_TYPE", "json")

if worker_type == "json":
    from workers.json_worker.main import main
elif worker_type == "video":
    from workers.video_worker.main import main
else:
    print(f"Unknown worker type: {worker_type}", file=sys.stderr)
    sys.exit(1)

asyncio.run(main())

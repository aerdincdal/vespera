"""Simple in-memory store with CRUD helpers.

Every collection is a list of dicts keyed by ``id``. The store is seeded at
import time from ``app.data.seed`` and lives for the process lifetime.
"""

from __future__ import annotations

import copy
import threading
import uuid
from typing import Any, Callable, Optional

from app.data import seed


class Collection:
    def __init__(self, name: str, rows: list[dict], prefix: str):
        self.name = name
        self.prefix = prefix
        self._rows: list[dict] = copy.deepcopy(rows)
        self._lock = threading.RLock()

    # -- read ---------------------------------------------------------------
    def all(self) -> list[dict]:
        with self._lock:
            return copy.deepcopy(self._rows)

    def get(self, item_id: str) -> Optional[dict]:
        with self._lock:
            for row in self._rows:
                if row.get("id") == item_id:
                    return copy.deepcopy(row)
        return None

    def exists(self, item_id: str) -> bool:
        return self.get(item_id) is not None

    # -- write --------------------------------------------------------------
    def new_id(self) -> str:
        return f"{self.prefix}{uuid.uuid4().hex[:8]}"

    def create(self, data: dict) -> dict:
        with self._lock:
            row = copy.deepcopy(data)
            if not row.get("id"):
                row["id"] = self.new_id()
            self._rows.append(row)
            return copy.deepcopy(row)

    def update(self, item_id: str, patch: dict) -> Optional[dict]:
        with self._lock:
            for row in self._rows:
                if row.get("id") == item_id:
                    for k, v in patch.items():
                        if k == "id" or v is None:
                            continue
                        row[k] = copy.deepcopy(v)
                    return copy.deepcopy(row)
        return None

    def replace(self, item_id: str, data: dict) -> Optional[dict]:
        with self._lock:
            for i, row in enumerate(self._rows):
                if row.get("id") == item_id:
                    new_row = copy.deepcopy(data)
                    new_row["id"] = item_id
                    self._rows[i] = new_row
                    return copy.deepcopy(new_row)
        return None

    def delete(self, item_id: str) -> bool:
        with self._lock:
            before = len(self._rows)
            self._rows = [r for r in self._rows if r.get("id") != item_id]
            return len(self._rows) < before

    def find(self, predicate: Callable[[dict], bool]) -> list[dict]:
        with self._lock:
            return [copy.deepcopy(r) for r in self._rows if predicate(r)]


class Store:
    def __init__(self):
        self.widgets = Collection("widgets", seed.WIDGETS, "w")
        self.users = Collection("users", seed.USERS, "u")
        self.roles = Collection("roles", seed.ROLES, "role")
        self.reports = Collection("reports", seed.REPORTS, "r")
        self.emails = Collection("emails", seed.EMAILS, "e")
        self.datasources = Collection("datasources", seed.DATASOURCES, "ds")
        self.theme: dict[str, Any] = copy.deepcopy(seed.THEME_DEFAULT)
        # id -> pandas.DataFrame for uploaded sources (kept out of JSON rows)
        self.dataframes: dict[str, Any] = {}
        self._lock = threading.RLock()

    def get_theme(self) -> dict:
        with self._lock:
            return copy.deepcopy(self.theme)

    def set_theme(self, theme: dict) -> dict:
        with self._lock:
            self.theme = copy.deepcopy(theme)
            return copy.deepcopy(self.theme)

    def reset_theme(self) -> dict:
        return self.set_theme(seed.THEME_DEFAULT)


store = Store()

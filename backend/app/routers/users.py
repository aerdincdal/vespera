from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.data import seed
from app.store import store

router = APIRouter(tags=["users"])

_ROLE_NAMES = {r["name"] for r in seed.ROLES}


class UserCreate(BaseModel):
    name: str
    email: str
    role: str = "Gözlemci"
    status: str = "Aktif"


class UserPatch(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    lastLogin: Optional[str] = None


def _check_role(role: Optional[str]):
    if role is not None and role not in _ROLE_NAMES:
        raise HTTPException(status_code=422, detail=f"Geçersiz rol: {role}. Geçerli roller: {', '.join(sorted(_ROLE_NAMES))}")


def _refresh_role_counts():
    users = store.users.all()
    for role in store.roles.all():
        store.roles.update(role["id"], {"userCount": sum(1 for u in users if u["role"] == role["name"])})


@router.get("/users")
def list_users(q: Optional[str] = Query(None, description="İsim veya e-posta araması")):
    rows = store.users.all()
    if q:
        ql = q.lower()
        rows = [u for u in rows if ql in u["name"].lower() or ql in u["email"].lower()]
    return rows


@router.post("/users", status_code=201)
def create_user(body: UserCreate):
    _check_role(body.role)
    if any(u["email"].lower() == body.email.lower() for u in store.users.all()):
        raise HTTPException(status_code=409, detail="Bu e-posta adresi zaten kayıtlı")
    row = store.users.create({**body.model_dump(), "lastLogin": "Henüz giriş yapmadı"})
    _refresh_role_counts()
    return row


@router.get("/users/{user_id}")
def get_user(user_id: str):
    row = store.users.get(user_id)
    if not row:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    return row


@router.patch("/users/{user_id}")
def patch_user(user_id: str, body: UserPatch):
    _check_role(body.role)
    row = store.users.update(user_id, body.model_dump(exclude_none=True))
    if not row:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    _refresh_role_counts()
    return row


@router.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: str):
    if not store.users.delete(user_id):
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    _refresh_role_counts()
    return None


@router.get("/roles")
def list_roles():
    return {"modules": seed.ROLE_MODULES, "roles": store.roles.all()}


class RolePermissionsPatch(BaseModel):
    permissions: dict[str, dict[str, bool]]


@router.patch("/roles/{role_id}")
def patch_role(role_id: str, body: RolePermissionsPatch):
    role = store.roles.get(role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Rol bulunamadı")
    perms = role["permissions"]
    for slug, p in body.permissions.items():
        perms.setdefault(slug, {"view": False, "edit": False, "delete": False}).update({k: bool(v) for k, v in p.items() if k in ("view", "edit", "delete")})
    return store.roles.update(role_id, {"permissions": perms})

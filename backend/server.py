from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', 'fieldops-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Weather API
OPENWEATHER_API_KEY = os.environ.get('OPENWEATHER_API_KEY', '')

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI(title="FieldOps Pro API")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "technician"  # admin, dispatcher, technician
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    phone: Optional[str] = None
    avatar: Optional[str] = None
    status: str = "available"
    location: Optional[dict] = None
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"  # low, medium, high, urgent
    status: str = "pending"  # pending, in_progress, completed, cancelled
    assigned_to: Optional[str] = None
    location: Optional[dict] = None  # {lat, lng, address}
    scheduled_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    estimated_duration: Optional[int] = None  # minutes
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    notes: Optional[str] = None
    inventory_items: Optional[List[dict]] = None  # [{item_id, quantity}]

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    location: Optional[dict] = None
    scheduled_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    estimated_duration: Optional[int] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    notes: Optional[str] = None
    inventory_items: Optional[List[dict]] = None

class TaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    priority: str
    status: str
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    location: Optional[dict] = None
    scheduled_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    estimated_duration: Optional[int] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    notes: Optional[str] = None
    inventory_items: Optional[List[dict]] = None
    created_by: str
    created_at: datetime
    updated_at: datetime

class InventoryItemCreate(BaseModel):
    name: str
    sku: str
    description: Optional[str] = None
    quantity: int = 0
    min_quantity: int = 0
    unit: str = "pcs"
    category: str = "general"
    price: float = 0.0
    location: Optional[str] = None

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[int] = None
    min_quantity: Optional[int] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    location: Optional[str] = None

class InventoryItemResponse(BaseModel):
    id: str
    name: str
    sku: str
    description: Optional[str] = None
    quantity: int
    min_quantity: int
    unit: str
    category: str
    price: float
    location: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class LocationUpdate(BaseModel):
    lat: float
    lng: float

class TeamMemberUpdate(BaseModel):
    status: Optional[str] = None  # available, busy, offline
    phone: Optional[str] = None
    name: Optional[str] = None

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "role": user_data.role,
        "phone": user_data.phone,
        "avatar": None,
        "status": "available",
        "location": None,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_access_token({"sub": user_id})
    user_response = UserResponse(
        id=user_id,
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        phone=user_data.phone,
        status="available",
        created_at=now
    )
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user["id"]})
    created_at = user.get("created_at")
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        phone=user.get("phone"),
        avatar=user.get("avatar"),
        status=user.get("status", "available"),
        location=user.get("location"),
        created_at=created_at
    )
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    created_at = current_user.get("created_at")
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],
        phone=current_user.get("phone"),
        avatar=current_user.get("avatar"),
        status=current_user.get("status", "available"),
        location=current_user.get("location"),
        created_at=created_at
    )

# ==================== TASK ROUTES ====================

@api_router.post("/tasks", response_model=TaskResponse)
async def create_task(task_data: TaskCreate, current_user: dict = Depends(get_current_user)):
    task_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    assigned_to_name = None
    if task_data.assigned_to:
        assignee = await db.users.find_one({"id": task_data.assigned_to}, {"_id": 0, "name": 1})
        if assignee:
            assigned_to_name = assignee["name"]
    
    task_doc = {
        "id": task_id,
        "title": task_data.title,
        "description": task_data.description,
        "priority": task_data.priority,
        "status": task_data.status,
        "assigned_to": task_data.assigned_to,
        "assigned_to_name": assigned_to_name,
        "location": task_data.location,
        "scheduled_date": task_data.scheduled_date.isoformat() if task_data.scheduled_date else None,
        "due_date": task_data.due_date.isoformat() if task_data.due_date else None,
        "estimated_duration": task_data.estimated_duration,
        "customer_name": task_data.customer_name,
        "customer_phone": task_data.customer_phone,
        "notes": task_data.notes,
        "inventory_items": task_data.inventory_items,
        "created_by": current_user["id"],
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.tasks.insert_one(task_doc)
    
    return TaskResponse(
        id=task_id,
        title=task_data.title,
        description=task_data.description,
        priority=task_data.priority,
        status=task_data.status,
        assigned_to=task_data.assigned_to,
        assigned_to_name=assigned_to_name,
        location=task_data.location,
        scheduled_date=task_data.scheduled_date,
        due_date=task_data.due_date,
        estimated_duration=task_data.estimated_duration,
        customer_name=task_data.customer_name,
        customer_phone=task_data.customer_phone,
        notes=task_data.notes,
        inventory_items=task_data.inventory_items,
        created_by=current_user["id"],
        created_at=now,
        updated_at=now
    )

@api_router.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if assigned_to:
        query["assigned_to"] = assigned_to
    
    tasks = await db.tasks.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    result = []
    for task in tasks:
        scheduled_date = task.get("scheduled_date")
        due_date = task.get("due_date")
        created_at = task.get("created_at")
        updated_at = task.get("updated_at")
        
        if isinstance(scheduled_date, str):
            scheduled_date = datetime.fromisoformat(scheduled_date)
        if isinstance(due_date, str):
            due_date = datetime.fromisoformat(due_date)
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        if isinstance(updated_at, str):
            updated_at = datetime.fromisoformat(updated_at)
        
        result.append(TaskResponse(
            id=task["id"],
            title=task["title"],
            description=task.get("description"),
            priority=task["priority"],
            status=task["status"],
            assigned_to=task.get("assigned_to"),
            assigned_to_name=task.get("assigned_to_name"),
            location=task.get("location"),
            scheduled_date=scheduled_date,
            due_date=due_date,
            estimated_duration=task.get("estimated_duration"),
            customer_name=task.get("customer_name"),
            customer_phone=task.get("customer_phone"),
            notes=task.get("notes"),
            inventory_items=task.get("inventory_items"),
            created_by=task["created_by"],
            created_at=created_at,
            updated_at=updated_at
        ))
    
    return result

@api_router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, current_user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    scheduled_date = task.get("scheduled_date")
    due_date = task.get("due_date")
    created_at = task.get("created_at")
    updated_at = task.get("updated_at")
    
    if isinstance(scheduled_date, str):
        scheduled_date = datetime.fromisoformat(scheduled_date)
    if isinstance(due_date, str):
        due_date = datetime.fromisoformat(due_date)
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    if isinstance(updated_at, str):
        updated_at = datetime.fromisoformat(updated_at)
    
    return TaskResponse(
        id=task["id"],
        title=task["title"],
        description=task.get("description"),
        priority=task["priority"],
        status=task["status"],
        assigned_to=task.get("assigned_to"),
        assigned_to_name=task.get("assigned_to_name"),
        location=task.get("location"),
        scheduled_date=scheduled_date,
        due_date=due_date,
        estimated_duration=task.get("estimated_duration"),
        customer_name=task.get("customer_name"),
        customer_phone=task.get("customer_phone"),
        notes=task.get("notes"),
        inventory_items=task.get("inventory_items"),
        created_by=task["created_by"],
        created_at=created_at,
        updated_at=updated_at
    )

@api_router.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, task_data: TaskUpdate, current_user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_data.model_dump(exclude_unset=True)
    if "scheduled_date" in update_data and update_data["scheduled_date"]:
        update_data["scheduled_date"] = update_data["scheduled_date"].isoformat()
    if "due_date" in update_data and update_data["due_date"]:
        update_data["due_date"] = update_data["due_date"].isoformat()
    
    if "assigned_to" in update_data and update_data["assigned_to"]:
        assignee = await db.users.find_one({"id": update_data["assigned_to"]}, {"_id": 0, "name": 1})
        if assignee:
            update_data["assigned_to_name"] = assignee["name"]
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    
    return await get_task(task_id, current_user)

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}

# ==================== INVENTORY ROUTES ====================

@api_router.post("/inventory", response_model=InventoryItemResponse)
async def create_inventory_item(item_data: InventoryItemCreate, current_user: dict = Depends(get_current_user)):
    item_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    item_doc = {
        "id": item_id,
        "name": item_data.name,
        "sku": item_data.sku,
        "description": item_data.description,
        "quantity": item_data.quantity,
        "min_quantity": item_data.min_quantity,
        "unit": item_data.unit,
        "category": item_data.category,
        "price": item_data.price,
        "location": item_data.location,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.inventory.insert_one(item_doc)
    
    return InventoryItemResponse(
        id=item_id,
        name=item_data.name,
        sku=item_data.sku,
        description=item_data.description,
        quantity=item_data.quantity,
        min_quantity=item_data.min_quantity,
        unit=item_data.unit,
        category=item_data.category,
        price=item_data.price,
        location=item_data.location,
        created_at=now,
        updated_at=now
    )

@api_router.get("/inventory", response_model=List[InventoryItemResponse])
async def get_inventory(
    category: Optional[str] = None,
    low_stock: Optional[bool] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if category:
        query["category"] = category
    
    items = await db.inventory.find(query, {"_id": 0}).sort("name", 1).to_list(1000)
    
    result = []
    for item in items:
        if low_stock and item["quantity"] > item["min_quantity"]:
            continue
        
        created_at = item.get("created_at")
        updated_at = item.get("updated_at")
        
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        if isinstance(updated_at, str):
            updated_at = datetime.fromisoformat(updated_at)
        
        result.append(InventoryItemResponse(
            id=item["id"],
            name=item["name"],
            sku=item["sku"],
            description=item.get("description"),
            quantity=item["quantity"],
            min_quantity=item["min_quantity"],
            unit=item["unit"],
            category=item["category"],
            price=item["price"],
            location=item.get("location"),
            created_at=created_at,
            updated_at=updated_at
        ))
    
    return result

@api_router.put("/inventory/{item_id}", response_model=InventoryItemResponse)
async def update_inventory_item(item_id: str, item_data: InventoryItemUpdate, current_user: dict = Depends(get_current_user)):
    item = await db.inventory.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = item_data.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.inventory.update_one({"id": item_id}, {"$set": update_data})
    
    updated_item = await db.inventory.find_one({"id": item_id}, {"_id": 0})
    created_at = updated_item.get("created_at")
    updated_at = updated_item.get("updated_at")
    
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    if isinstance(updated_at, str):
        updated_at = datetime.fromisoformat(updated_at)
    
    return InventoryItemResponse(
        id=updated_item["id"],
        name=updated_item["name"],
        sku=updated_item["sku"],
        description=updated_item.get("description"),
        quantity=updated_item["quantity"],
        min_quantity=updated_item["min_quantity"],
        unit=updated_item["unit"],
        category=updated_item["category"],
        price=updated_item["price"],
        location=updated_item.get("location"),
        created_at=created_at,
        updated_at=updated_at
    )

@api_router.delete("/inventory/{item_id}")
async def delete_inventory_item(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.inventory.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"}

# ==================== TEAM ROUTES ====================

@api_router.get("/team", response_model=List[UserResponse])
async def get_team_members(
    role: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if role:
        query["role"] = role
    if status:
        query["status"] = status
    
    users = await db.users.find(query, {"_id": 0, "password": 0}).to_list(1000)
    
    result = []
    for user in users:
        created_at = user.get("created_at")
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        
        result.append(UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            phone=user.get("phone"),
            avatar=user.get("avatar"),
            status=user.get("status", "available"),
            location=user.get("location"),
            created_at=created_at
        ))
    
    return result

@api_router.put("/team/{user_id}", response_model=UserResponse)
async def update_team_member(user_id: str, update_data: TeamMemberUpdate, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_dict = update_data.model_dump(exclude_unset=True)
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one({"id": user_id}, {"$set": update_dict})
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    created_at = updated_user.get("created_at")
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    
    return UserResponse(
        id=updated_user["id"],
        email=updated_user["email"],
        name=updated_user["name"],
        role=updated_user["role"],
        phone=updated_user.get("phone"),
        avatar=updated_user.get("avatar"),
        status=updated_user.get("status", "available"),
        location=updated_user.get("location"),
        created_at=created_at
    )

@api_router.put("/team/{user_id}/location")
async def update_user_location(user_id: str, location: LocationUpdate, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    location_data = {
        "lat": location.lat,
        "lng": location.lng,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.update_one({"id": user_id}, {"$set": {"location": location_data}})
    
    return {"message": "Location updated successfully", "location": location_data}

# ==================== WEATHER ROUTES ====================

@api_router.get("/weather")
async def get_weather(lat: float, lon: float, current_user: dict = Depends(get_current_user)):
    if not OPENWEATHER_API_KEY:
        # Return mock weather data if no API key configured
        return {
            "temp": 72,
            "feels_like": 70,
            "humidity": 45,
            "description": "Clear sky",
            "icon": "01d",
            "wind_speed": 5.2,
            "location": "Local Area"
        }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": OPENWEATHER_API_KEY,
                    "units": "imperial"
                },
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            
            return {
                "temp": data["main"]["temp"],
                "feels_like": data["main"]["feels_like"],
                "humidity": data["main"]["humidity"],
                "description": data["weather"][0]["description"],
                "icon": data["weather"][0]["icon"],
                "wind_speed": data["wind"]["speed"],
                "location": data["name"]
            }
    except Exception as e:
        logger.error(f"Weather API error: {e}")
        return {
            "temp": 72,
            "feels_like": 70,
            "humidity": 45,
            "description": "Weather unavailable",
            "icon": "01d",
            "wind_speed": 0,
            "location": "Unknown"
        }

# ==================== ANALYTICS ROUTES ====================

@api_router.get("/analytics/overview")
async def get_analytics_overview(current_user: dict = Depends(get_current_user)):
    # Task statistics
    total_tasks = await db.tasks.count_documents({})
    pending_tasks = await db.tasks.count_documents({"status": "pending"})
    in_progress_tasks = await db.tasks.count_documents({"status": "in_progress"})
    completed_tasks = await db.tasks.count_documents({"status": "completed"})
    
    # Priority breakdown
    urgent_tasks = await db.tasks.count_documents({"priority": "urgent"})
    high_tasks = await db.tasks.count_documents({"priority": "high"})
    
    # Team statistics
    total_technicians = await db.users.count_documents({"role": "technician"})
    available_technicians = await db.users.count_documents({"role": "technician", "status": "available"})
    
    # Inventory alerts
    low_stock_items = await db.inventory.count_documents({
        "$expr": {"$lte": ["$quantity", "$min_quantity"]}
    })
    
    # Today's tasks
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    today_tasks = await db.tasks.count_documents({
        "scheduled_date": {
            "$gte": today_start.isoformat(),
            "$lt": today_end.isoformat()
        }
    })
    
    return {
        "tasks": {
            "total": total_tasks,
            "pending": pending_tasks,
            "in_progress": in_progress_tasks,
            "completed": completed_tasks,
            "today": today_tasks
        },
        "priorities": {
            "urgent": urgent_tasks,
            "high": high_tasks
        },
        "team": {
            "total": total_technicians,
            "available": available_technicians
        },
        "inventory": {
            "low_stock_alerts": low_stock_items
        }
    }

@api_router.get("/analytics/performance")
async def get_performance_data(
    days: int = 7,
    current_user: dict = Depends(get_current_user)
):
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    
    # Get tasks in date range
    tasks = await db.tasks.find({
        "created_at": {
            "$gte": start_date.isoformat(),
            "$lte": end_date.isoformat()
        }
    }, {"_id": 0}).to_list(1000)
    
    # Group by date
    daily_data = {}
    for i in range(days):
        date = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
        daily_data[date] = {"completed": 0, "created": 0}
    
    for task in tasks:
        created_at = task.get("created_at", "")
        if isinstance(created_at, str):
            date = created_at[:10]
            if date in daily_data:
                daily_data[date]["created"] += 1
                if task.get("status") == "completed":
                    daily_data[date]["completed"] += 1
    
    chart_data = [
        {"date": date, **data}
        for date, data in sorted(daily_data.items())
    ]
    
    return {
        "chart_data": chart_data,
        "period_days": days
    }

# ==================== ROOT ROUTE ====================

@api_router.get("/")
async def root():
    return {"message": "FieldOps Pro API", "version": "1.0.0"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

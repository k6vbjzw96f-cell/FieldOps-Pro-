import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { teamAPI, tasksAPI, weatherAPI } from '@/services/api';
import { MapPin, User, Phone, Clock, Cloud, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// Fix leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const createIcon = (color) => L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const technicianIcon = createIcon('#2563eb');
const taskIcon = createIcon('#10b981');
const urgentIcon = createIcon('#ef4444');

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 12);
    }
  }, [center, map]);
  return null;
};

export const MapPage = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([-33.8688, 151.2093]); // Sydney, Australia

  const fetchData = async () => {
    try {
      const [teamRes, tasksRes] = await Promise.all([
        teamAPI.getAll(),
        tasksAPI.getAll({ status: 'in_progress' }),
      ]);
      
      setTeamMembers(teamRes.data);
      setTasks(tasksRes.data.filter(t => t.location?.lat && t.location?.lng));

      // Set center to first technician with location
      const memberWithLocation = teamRes.data.find(m => m.location?.lat);
      if (memberWithLocation) {
        setMapCenter([memberWithLocation.location.lat, memberWithLocation.location.lng]);
      }

      // Fetch weather
      try {
        const weatherRes = await weatherAPI.get(mapCenter[0], mapCenter[1]);
        setWeather(weatherRes.data);
      } catch (e) {
        console.log('Weather unavailable');
      }
    } catch (error) {
      toast.error('Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  const membersWithLocation = teamMembers.filter(m => m.location?.lat && m.location?.lng);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="map-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-[Manrope]">Map View</h2>
          <p className="text-slate-500">Track technicians and job locations in real-time</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} data-testid="refresh-map-btn">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          {/* Weather */}
          {weather && (
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">Current Weather</p>
                    <p className="text-3xl font-bold font-[Manrope]">{Math.round(weather.temp)}°F</p>
                    <p className="capitalize">{weather.description}</p>
                  </div>
                  <Cloud className="h-12 w-12 opacity-80" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-[Manrope]">Team Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedMember?.id === member.id
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-slate-200 hover:border-blue-300'
                  }`}
                  onClick={() => {
                    setSelectedMember(member);
                    if (member.location?.lat) {
                      setMapCenter([member.location.lat, member.location.lng]);
                    }
                  }}
                  data-testid={`team-member-${member.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium ${
                      member.status === 'available' ? 'bg-green-500' :
                      member.status === 'busy' ? 'bg-yellow-500' : 'bg-slate-400'
                    }`}>
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{member.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${
                          member.status === 'available' ? 'bg-green-50 text-green-700' :
                          member.status === 'busy' ? 'bg-yellow-50 text-yellow-700' : 'bg-slate-50 text-slate-700'
                        }`}>
                          {member.status}
                        </Badge>
                        {member.location && (
                          <MapPin className="h-3 w-3 text-blue-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Active Tasks */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-[Manrope]">Active Jobs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
              {tasks.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No active jobs with locations</p>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg border border-slate-200 hover:border-green-300 cursor-pointer"
                    onClick={() => setMapCenter([task.location.lat, task.location.lng])}
                    data-testid={`map-task-${task.id}`}
                  >
                    <p className="font-medium text-slate-900 text-sm">{task.title}</p>
                    <p className="text-xs text-slate-500 truncate">{task.location.address}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            <div className="map-container h-[calc(100vh-14rem)]" data-testid="map-container">
              <MapContainer
                center={mapCenter}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapUpdater center={mapCenter} />

                {/* Technician Markers */}
                {membersWithLocation.map((member) => (
                  <Marker
                    key={member.id}
                    position={[member.location.lat, member.location.lng]}
                    icon={technicianIcon}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium ${
                            member.status === 'available' ? 'bg-green-500' :
                            member.status === 'busy' ? 'bg-yellow-500' : 'bg-slate-400'
                          }`}>
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold">{member.name}</p>
                            <Badge variant="outline" className="text-xs capitalize">{member.status}</Badge>
                          </div>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="h-4 w-4" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Task Markers */}
                {tasks.map((task) => (
                  <Marker
                    key={task.id}
                    position={[task.location.lat, task.location.lng]}
                    icon={task.priority === 'urgent' ? urgentIcon : taskIcon}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <p className="font-semibold mb-1">{task.title}</p>
                        <p className="text-sm text-slate-600 mb-2">{task.location.address}</p>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <User className="h-4 w-4" />
                          <span>{task.customer_name || 'No customer'}</span>
                        </div>
                        {task.assigned_to_name && (
                          <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                            <Clock className="h-4 w-4" />
                            <span>Assigned to {task.assigned_to_name}</span>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MapPage;

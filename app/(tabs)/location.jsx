import { useEffect, useState, useRef } from "react";
import { 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  Pressable, 
  Linking, 
  Platform,
  RefreshControl,
  ScrollView 
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import io from "socket.io-client";
import api from "../../services/api";

const SOCKET_URL = "http://192.168.1.165:5000";

export default function LocationScreen() {
  const [childName, setChildName] = useState("Child");
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const webViewRef = useRef(null);

  const fetchLocation = async () => {
    try {
      const childrenRes = await api.get("/children");
      if (childrenRes.data.length === 0) {
        setErrorMsg("No children linked to your account.");
        return;
      }
      
      const child = childrenRes.data[0];
      setChildName(child.childId?.name || "Child");

      const locationRes = await api.get(`/location/${child.childId._id}`);
      
      if (locationRes.data.length > 0) {
        const latestLoc = locationRes.data[0];
        setLocation(latestLoc);
        setErrorMsg("");

        if (webViewRef.current && latestLoc.latitude && latestLoc.longitude) {
          const speedKmh = Math.round((latestLoc.speed || 0) * 3.6);
          webViewRef.current.injectJavaScript(
            `if (window.updateLocation) { window.updateLocation(${latestLoc.latitude}, ${latestLoc.longitude}, ${speedKmh}); } true;`
          );
        }
      } else {
        setErrorMsg("No location data available for the child.");
      }
    } catch (err) {
      console.error("Fetch Location Error:", err.message);
      setErrorMsg("Failed to fetch location data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLocation();

    // Real-Time Socket.IO Live Listener
    const socket = io(SOCKET_URL, { transports: ["websocket"] });

    socket.on("location-update", (data) => {
      console.log("[Socket] Real-time map update received:", data);
      if (data && data.latitude && data.longitude) {
        setLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          speed: data.speed || 0,
          timestamp: data.timestamp || new Date().toISOString()
        });

        if (webViewRef.current) {
          const speedKmh = Math.round((data.speed || 0) * 3.6);
          webViewRef.current.injectJavaScript(
            `if (window.updateLocation) { window.updateLocation(${data.latitude}, ${data.longitude}, ${speedKmh}); } true;`
          );
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLocation();
  };

  const openGoogleMaps = () => {
    if (location?.latitude && location?.longitude) {
      const lat = location.latitude;
      const lng = location.longitude;
      const label = encodeURIComponent(`${childName}'s Location`);
      
      const url = Platform.select({
        ios: `maps:0,0?q=${lat},${lng}`,
        android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
      });

      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3366FF" />
        <Text style={styles.loadingText}>Fetching live location map...</Text>
      </View>
    );
  }

  const speedKmh = location?.speed ? Math.round(location.speed * 3.6) : 0;
  const isSpeeding = speedKmh > 60;

  const mapHtml = location ? `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html { margin: 0; padding: 0; height: 100%; width: 100%; background: #f0f2f5; font-family: sans-serif; }
        #map { height: 100%; width: 100%; }
        .custom-marker {
          background-color: #3366FF;
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 15px rgba(51, 102, 255, 0.8);
          width: 26px;
          height: 26px;
          position: relative;
          z-index: 2;
        }
        .pulse {
          position: absolute;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(51, 102, 255, 0.35);
          animation: pulse 2s infinite;
          top: -12px;
          left: -12px;
          z-index: 1;
        }
        @keyframes pulse {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2.0); opacity: 0; }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 4px;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([${location.latitude}, ${location.longitude}], 16);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: 'OpenStreetMap'
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        var customIcon = L.divIcon({
          className: 'marker-container',
          html: '<div style="position:relative;"><div class="pulse"></div><div class="custom-marker"></div></div>',
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        var marker = L.marker([${location.latitude}, ${location.longitude}], { icon: customIcon }).addTo(map);
        marker.bindPopup('<b>${childName}</b><br>Speed: ${speedKmh} km/h').openPopup();

        window.updateLocation = function(lat, lng, speed) {
          var newLatLng = new L.LatLng(lat, lng);
          marker.setLatLng(newLatLng);
          map.panTo(newLatLng);
          marker.getPopup().setContent('<b>${childName}</b><br>Speed: ' + speed + ' km/h');
        };
      </script>
    </body>
    </html>
  ` : "";

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {errorMsg ? (
        <View style={styles.errorCard}>
          <Ionicons name="warning-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : (
        <View style={styles.container}>
          {/* Header Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.headerRow}>
              <View style={styles.childBadge}>
                <Ionicons name="person-circle" size={32} color="#3366FF" />
                <View>
                  <Text style={styles.childName}>{childName}</Text>
                  <Text style={styles.statusText}>● Live Tracking Active</Text>
                </View>
              </View>
              
              <View style={[styles.speedBadge, isSpeeding && styles.speedingBadge]}>
                <Ionicons name="speedometer" size={18} color={isSpeeding ? "#fff" : "#3366FF"} />
                <Text style={[styles.speedText, isSpeeding && styles.speedingText]}>
                  {speedKmh} km/h
                </Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                Lat: {location.latitude.toFixed(5)}, Long: {location.longitude.toFixed(5)}
              </Text>
              <Text style={styles.timeText}>
                {new Date(location.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>

          {/* Interactive Live Map View */}
          <View style={styles.mapContainer}>
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html: mapHtml }}
              style={styles.map}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          </View>

          {/* External Map Navigation Button */}
          <Pressable style={styles.mapButton} onPress={openGoogleMaps}>
            <Ionicons name="navigate-circle" size={24} color="#fff" />
            <Text style={styles.mapButtonText}>Open in Google Maps / Navigation</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, backgroundColor: "#F4F6F9" },
  container: { flex: 1, padding: 16 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  loadingText: { marginTop: 12, color: "#666", fontSize: 16 },
  errorCard: { backgroundColor: "#fff", padding: 30, borderRadius: 16, alignItems: "center", margin: 20, elevation: 2 },
  errorText: { color: "#FF3B30", fontSize: 16, marginTop: 10, textAlign: "center" },
  
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  childBadge: { flexDirection: "row", alignItems: "center", gap: 10 },
  childName: { fontSize: 18, fontWeight: "bold", color: "#1A1D20" },
  statusText: { fontSize: 12, color: "#34C759", fontWeight: "600", marginTop: 2 },
  
  speedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  speedingBadge: { backgroundColor: "#FF3B30" },
  speedText: { fontSize: 14, fontWeight: "bold", color: "#3366FF" },
  speedingText: { color: "#ffffff" },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F2F5",
  },
  metaText: { fontSize: 13, color: "#6C757D" },
  timeText: { fontSize: 13, color: "#6C757D", fontWeight: "500" },

  mapContainer: {
    height: 380,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: "#e5e3df",
  },
  map: { flex: 1 },

  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#3366FF",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 16,
    shadowColor: "#3366FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  mapButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
});

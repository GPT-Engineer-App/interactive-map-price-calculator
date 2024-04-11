import { useState, useEffect } from "react";
import { Box, Button, Text, VStack } from "@chakra-ui/react";
import { FaMapMarkerAlt } from "react-icons/fa";

const COST_PER_KM = 19;
const BASE_FARE = 580;

const Index = () => {
  const [map, setMap] = useState(null);
  const [companyPosition, setCompanyPosition] = useState({ lat: 26.825465, lng: -100.1859077 });
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [distance, setDistance] = useState(0);
  const [price, setPrice] = useState(0);
  const [routePolyline, setRoutePolyline] = useState(null);

  useEffect(() => {
    // Load the Google Maps API script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBYG93ssZJmfQyo3xTmHAg9f3JkfrlLYyE&callback=initMap`;
    script.onload = initMap;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const initMap = () => {
    const mapOptions = {
      center: companyPosition,
      zoom: 12,
    };
    const newMap = new window.google.maps.Map(document.getElementById("map"), mapOptions);
    setMap(newMap);

    new window.google.maps.Marker({
      position: companyPosition,
      map: newMap,
      title: "Company",
    });
  };

  const [pickupMarker, setPickupMarker] = useState(null);
  const [destinationMarker, setDestinationMarker] = useState(null);

  const handleMapClick = (event) => {
    const clickedLocation = event.latLng;

    if (!pickupLocation) {
      setPickupLocation(clickedLocation);
      const marker = new window.google.maps.Marker({
        position: clickedLocation,
        map: map,
        title: "Pickup Location",
        draggable: true,
      });
      marker.addListener("dragend", () => {
        setPickupLocation(marker.getPosition());
        calculateDistance();
      });
      setPickupMarker(marker);
    } else if (!destination) {
      setDestination(clickedLocation);
      const marker = new window.google.maps.Marker({
        position: clickedLocation,
        map: map,
        title: "Destination",
        draggable: true,
      });
      marker.addListener("dragend", () => {
        setDestination(marker.getPosition());
        calculateDistance();
      });
      setDestinationMarker(marker);
    }
  };

  const calculateDistance = () => {
    if (pickupMarker && destinationMarker) {
      const distanceService = new window.google.maps.DistanceMatrixService();
      distanceService.getDistanceMatrix(
        {
          origins: [companyPosition, pickupMarker.getPosition()],
          destinations: [pickupMarker.getPosition(), destinationMarker.getPosition()],
          travelMode: "DRIVING",
        },
        (response, status) => {
          if (status === "OK") {
            const companyToPickupDistance = response.rows[0].elements[0].distance.value;
            const pickupToDestinationDistance = response.rows[1].elements[1].distance.value;
            const totalDistanceInMeters = companyToPickupDistance + pickupToDestinationDistance;
            const distanceInKm = totalDistanceInMeters / 1000;
            setDistance(distanceInKm);
            calculatePrice(distanceInKm);
            calculateRoute();
          }
        },
      );
    }
  };

  const calculatePrice = (distance) => {
    const totalPrice = BASE_FARE + distance * COST_PER_KM;
    setPrice(totalPrice);
  };

  const calculateRoute = () => {
    if (pickupLocation && destination) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: pickupLocation,
          destination: destination,
          travelMode: "DRIVING",
        },
        (response, status) => {
          if (status === "OK") {
            if (routePolyline) {
              routePolyline.setMap(null);
            }
            const newRoutePolyline = new window.google.maps.Polyline({
              path: response.routes[0].overview_path,
              strokeColor: "#FF0000",
              strokeOpacity: 1.0,
              strokeWeight: 2,
            });
            newRoutePolyline.setMap(map);
            setRoutePolyline(newRoutePolyline);
          }
        },
      );
    }
  };

  return (
    <Box>
      <Box id="map" h="400px" onClick={handleMapClick} />
      <VStack mt={4} spacing={4}>
        <Text>
          {pickupLocation && (
            <>
              Pickup Location: {pickupLocation.lat()}, {pickupLocation.lng()}
            </>
          )}
        </Text>
        <Text>
          {destination && (
            <>
              Destination: {destination.lat()}, {destination.lng()}
            </>
          )}
        </Text>
        <Button leftIcon={<FaMapMarkerAlt />} onClick={calculateDistance} disabled={!pickupLocation || !destination}>
          Calculate Distance
        </Button>
        <Text>Distance: {distance} km</Text>
        <Text>Price: ${price}</Text>
      </VStack>
    </Box>
  );
};

export default Index;

import { useState, useEffect } from "react";
import { Box, Button, Text, VStack } from "@chakra-ui/react";
import { FaMapMarkerAlt } from "react-icons/fa";

const COST_PER_KM = 19;
const BASE_FARE = 580;

const Index = () => {
  const [map, setMap] = useState(null);
  const [companyPosition, setCompanyPosition] = useState({ lat: 0, lng: 0 });
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [distance, setDistance] = useState(0);
  const [price, setPrice] = useState(0);

  useEffect(() => {
    // Load the Google Maps API script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY`;
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

  const handleMapClick = (event) => {
    const clickedLocation = event.latLng;

    if (!pickupLocation) {
      setPickupLocation(clickedLocation);
      new window.google.maps.Marker({
        position: clickedLocation,
        map: map,
        title: "Pickup Location",
      });
    } else if (!destination) {
      // Set the destination marker
      setDestination(clickedLocation);
      new window.google.maps.Marker({
        position: clickedLocation,
        map: map,
        title: "Destination",
      });
    }
  };

  const calculateDistance = () => {
    if (pickupLocation && destination) {
      const distanceService = new window.google.maps.DistanceMatrixService();
      distanceService.getDistanceMatrix(
        {
          origins: [companyPosition, pickupLocation],
          destinations: [pickupLocation, destination],
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
          }
        },
      );
    }
  };

  const calculatePrice = (distance) => {
    const totalPrice = BASE_FARE + distance * COST_PER_KM;
    setPrice(totalPrice);
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

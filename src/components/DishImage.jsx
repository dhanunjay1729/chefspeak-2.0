// src/components/DishImage.jsx
import React, { useEffect, useState } from "react";
import { fetchDishImage } from "../services/unsplashService";

const DishImage = ({ dishName }) => {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getImage = async () => {
      if (!dishName) return;
      setLoading(true);
      const url = await fetchDishImage(dishName);
      setImageUrl(url);
      setLoading(false);
    };
    getImage();
  }, [dishName]);

  if (!dishName) return null;

  return (
    <div className="w-full my-4 flex justify-center">
      {loading && <p>Loading image…</p>}
      {!loading && imageUrl && (
        <img
          src={imageUrl}
          alt={dishName}
          className="rounded-2xl shadow-lg max-h-96 object-cover"
        />
      )}
      {!loading && !imageUrl && (
        <p className="text-gray-500">No image found for {dishName}</p>
      )}
    </div>
  );
};

export default DishImage;

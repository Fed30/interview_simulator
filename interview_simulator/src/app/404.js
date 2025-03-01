"use client";
import React from "react";
import Image from "next/image";

export default function Custom404() {
  return (
    <div className="not-found-container">
      <h1 className="lg:text-3xl text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#F25E86] to-[#6D81F2] relative pb-2">
        404 - Page Not Found
      </h1>
      <Image
        src="/404.png"
        width={400}
        height={400}
        alt="Page not found"
        className="w-3/4 sm:w-2/3 h-auto object-contain image-hover"
      />
      <p>Oops! The page you are looking for does not exist.</p>
      <a href="/" className="home-link">
        Go back home
      </a>
    </div>
  );
}

"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="not-found-container">
      <h1 className="lg:text-3xl text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#F25E86] to-[#6D81F2] relative mt-16">
        404 - Page Not Found
      </h1>
      <Image
        src="/404.png"
        width={80}
        height={80}
        alt="Page not found"
        className="w-20 h-20 sm:w-2/3 object-contain image-hover mx-auto"
      />
      <p className="text-lg mt-4 text-white opacity-90 text-shadow-md text-animated animate__animated animate__fadeIn animate__delay-1s">
        Oops! The page you are looking for does not exist.
      </p>
      <Link href="/" className="home-link mt-4">
        Go back home
      </Link>
    </div>
  );
}

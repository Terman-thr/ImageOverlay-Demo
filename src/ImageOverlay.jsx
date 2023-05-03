import React, { useEffect, useRef, useState } from 'react';

const isPointInPolygon = (point, polygon) => {
    const [px, py] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];

        if (((yi > py) !== (yj > py)) && (px < ((xj - xi) * (py - yi) / (yj - yi) + xi))) {
            inside = !inside;
        }
    }

    return inside;
};

const ImageOverlay = ({ imageUrl, parts }) => {
    const canvasRef = useRef(null);
    const [currentPart, setCurrentPart] = useState(null);

    const handleMouseMove = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const part = parts.find(({ polygon }) => {
            return isPointInPolygon([mouseX, mouseY], polygon);
        });

        setCurrentPart(part);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
        };
    }, [imageUrl]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const img = new Image();
        img.src = imageUrl;
        ctx.drawImage(img, 0, 0);

        if (currentPart) {
            const { name, polygon } = currentPart;

            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.moveTo(polygon[0][0], polygon[0][1]);
            for (let i = 1; i < polygon.length; i++) {
                ctx.lineTo(polygon[i][0], polygon[i][1]);
            }
            ctx.closePath();
            ctx.fill();

            ctx.font = '24px Arial'
            ctx.fillStyle = 'red';
            // Calculate the middle of the image
            const middleX = canvas.width / 2;
            const middleY = canvas.height / 2;

            // Calculate the width of the text and center it
            const textWidth = ctx.measureText(name).width;
            const textX = middleX - textWidth / 2;

            // Render the text in the middle of the image
            ctx.fillText(name, textX, middleY);
        }
    }, [imageUrl, currentPart]);

    return (
        <div>
            <canvas ref={canvasRef} onMouseMove={handleMouseMove} />
        </div>
    );
};

export default ImageOverlay;

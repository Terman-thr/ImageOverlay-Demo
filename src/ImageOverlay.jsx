import React, { useEffect, useRef, useState } from 'react';
import {subclass, metaclass} from "./config";

/**
 * Given a point and a polygon.
 * Return whether this point is inside the polygon using Ray casting algorithm.
 */
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
    const [selectedPart, setSelectedPart] = useState(null);
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

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

    /**
     * Click to select one part.
     * Right click to unselect that part.
     */
    const handleClick = (e) => {
        if (e.type === 'click') {
            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            setCursorPosition({ x: mouseX, y: mouseY });

            if (currentPart) {
                setSelectedPart(currentPart);
                // console.log(`Select ${currentPart.name}`)
            }
        }
        else if (e.type === 'contextmenu') {
            e.preventDefault();
            setSelectedPart(null);
        }
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

            ctx.fillStyle = 'rgba(255, 255, 0, 0.6)';
            ctx.beginPath();
            ctx.moveTo(polygon[0][0], polygon[0][1]);
            for (let i = 1; i < polygon.length; i++) {
                ctx.lineTo(polygon[i][0], polygon[i][1]);
            }
            ctx.closePath();
            ctx.fill();

            ctx.font = '24px Arial'
            ctx.fillStyle = 'green';
            // Calculate the middle of the image
            const middleX = canvas.width / 2;
            const middleY = canvas.height / 2;

            // Calculate the width of the text and center it
            const textWidth = ctx.measureText(name).width;
            const textX = middleX - textWidth / 2;
            const textY = canvas.height - 5;

            // Render the text in the middle of the image
            ctx.fillText(name, textX, textY);
        }
    }, [imageUrl, currentPart]);

    return (
        <div onContextMenu={handleClick}>
            <canvas ref={canvasRef} onMouseMove={handleMouseMove} onClick={handleClick} />
            {selectedPart && (
                <div
                    style={{
                        position: 'absolute',
                        top: `${cursorPosition.y}px`,
                        left: `${cursorPosition.x}px`,
                        background: 'rgba(255, 255, 255, 0.8)',
                        padding: '10px',
                        lineHeight: '5px',
                        borderRadius: '5px',
                        border: '1px solid black',
                    }}
                >
                    <b>{selectedPart.name}</b>&nbsp;
                    {metaclass[selectedPart.name].subclass.length > 0 ? (
                        <select>
                            {
                                metaclass[selectedPart.name].subclass.map(subclassName => {
                                    return <option value={subclassName}>{subclassName}</option>;
                                })
                            }
                        </select>
                    ) : (
                        <div></div>
                    )}

                    {metaclass[selectedPart.name].action.length > 0 ? (
                        <select>
                            {
                                metaclass[selectedPart.name].action.map(subclassName => {
                                    return <option value={subclassName}>{subclassName}</option>;
                                })
                            }
                        </select>
                    ) : (
                        <div></div>
                    )
                    }
                </div>
            )}
        </div>
    );
};

export default ImageOverlay;

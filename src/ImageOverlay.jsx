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

    const [labels, setLabels] = useState([]);  // Labels that selected and set by users.
    const [selectedSubclass, setSelectedSubclass] = useState(null);  // which subclass is selected in drop-down menu
    const [selectedAction, setSelectedAction] = useState(null);  // which action is selected in drop-down menu

    const [hoveredLabelIndex, setHoveredLabelIndex] = useState(null);
    const [selectedLabelIndex, setSelectedLabelIndex] = useState(null);

    const [initialText, setInitialText] = useState(null);  // Used for cancel button in input field to discard changes.

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

    // Detect subclass change in drop-down menu
    const handleSubclassChange = (e) => {
        setSelectedSubclass(e.target.value);
    };

    // Detect action change in drop-down menu
    const handleActionChange = (e) => {
        setSelectedAction(e.target.value);
    }

    /**
     * If there is subclass or action selected and confirm button is clicked,
     * Add a label to the position the same with menu, and push info of the new
     * label to ${labels} state.
     */
    const handleConfirmClick = () => {
        if (selectedPart && (selectedSubclass || selectedAction)) {
            const newLabel = {
                part: selectedPart.name,
                subclass: selectedSubclass,
                action: selectedAction,
                text: `${selectedPart.name}${selectedSubclass ? `: ${selectedSubclass}` : ''}${selectedAction ? ` ${selectedAction}` : ''}`,
                position: cursorPosition,
            };
            labels.push(newLabel);
            setSelectedPart(null);
            setSelectedAction(null);
            setSelectedSubclass(null);
        }
    }

    // Cancel selection of label
    const handleCancelClick = () => {
        setSelectedPart(null);
        setSelectedAction(null);
        setSelectedSubclass(null);
    };

    const handleLabelMouseEnter = (index) => {
        setHoveredLabelIndex(index);
    };

    const handleLabelMouseLeave = () => {
        setHoveredLabelIndex(null);
    };

    const handleLabelClick = (index) => {
        setSelectedLabelIndex(index);
        setInitialText(labels[index].text)
    };

    const handleLabelTextUpdate = (e) => {
        const updatedLabels = [...labels];
        updatedLabels[selectedLabelIndex].text = e.target.value;
        setLabels(updatedLabels);
    }

    const handleLabelTextChangeConfirm = () => {
        setSelectedLabelIndex(null);
    }

    const handleLabelTextChangeCancel = () => {
        const updatedLabels = [...labels];
        updatedLabels[selectedLabelIndex].text = initialText;
        setLabels(updatedLabels);
        setSelectedLabelIndex(null);
    }

    // Draw image on canvas.
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

    // Generate mask and text for current part.
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
                        <select onChange={handleSubclassChange}>
                            <option value="">Select a subclass</option>
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
                        <select onChange={handleActionChange}>
                            <option value="">Select an action</option>
                            {
                                metaclass[selectedPart.name].action.map(action => {
                                    return <option value={action}>{action}</option>;
                                })
                            }
                        </select>
                    ) : (
                        <div></div>
                    )
                    }
                    <br></br>
                    {metaclass[selectedPart.name].subclass.length > 0 || metaclass[selectedPart.name].action.length > 0 ? (
                        <>
                        <button onClick={handleConfirmClick}>Confirm</button>
                        <button onClick={handleCancelClick}>Cancel</button>
                        </>
                    ) : (
                        <div></div>
                    )}
                </div>
            )}
            <div>
                {labels.map((label, index) => (
                    <div
                        key={index}
                        style={{
                            position: 'absolute',
                            left: `${label.position.x}px`,
                            top: `${label.position.y}px`,
                        }}
                        onMouseEnter={() => handleLabelMouseEnter(index)}
                        onMouseLeave={handleLabelMouseLeave}
                        onClick={() => handleLabelClick(index)}
                    >
                        <div
                            style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                backgroundColor: 'red',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: 'white',
                            }}
                        >
                            {index + 1}
                        </div>
                        {(hoveredLabelIndex === index) && (
                            <div
                                style={{
                                    background: 'rgba(255, 255, 255, 0.8)',
                                    padding: '5px',
                                    borderRadius: '5px',
                                    border: '1px solid black',
                                    marginLeft: '25px',
                                }}
                            >
                                {label.text}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {selectedLabelIndex != null && (
                <div>
                    <h3>Customize Text</h3>
                    <label>Text:</label>
                    <input type="text" name="text" value={labels[selectedLabelIndex].text} onChange={handleLabelTextUpdate}/>
                    <br />
                    <button onClick={handleLabelTextChangeConfirm}>Confirm</button>
                    <button onClick={handleLabelTextChangeCancel}>Cancel</button>
                </div>
            )}
        </div>
    );
};

export default ImageOverlay;

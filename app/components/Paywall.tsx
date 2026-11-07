"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

type HotspotStyle = CSSProperties & {
  "--x": number;
  "--y": number;
  "--w": number;
  "--h": number;
};

type FieldId = "name" | "number" | "cvv" | "expiry";

interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
}

const INPUT_FIELDS: Array<{
  id: FieldId;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  dropdownX: number;
  dropdownY: number;
  dropdownW: number;
}> = [
  {
    id: "name",
    label: "Name on card",
    x: 52,
    y: 250,
    w: 924,
    h: 62,
    dropdownX: 52,
    dropdownY: 314,
    dropdownW: 520,
  },
  {
    id: "number",
    label: "Card number",
    x: 52,
    y: 382,
    w: 924,
    h: 62,
    dropdownX: 52,
    dropdownY: 446,
    dropdownW: 520,
  },
  {
    id: "cvv",
    label: "CCV/CVV",
    x: 254,
    y: 474,
    w: 200,
    h: 62,
    dropdownX: 254,
    dropdownY: 538,
    dropdownW: 460,
  },
  {
    id: "expiry",
    label: "Expiry date",
    x: 738,
    y: 474,
    w: 236,
    h: 62,
    dropdownX: 514,
    dropdownY: 538,
    dropdownW: 460,
  },
];

export default function Paywall({ isOpen, onClose }: PaywallProps) {
  const [isFilled, setIsFilled] = useState(false);
  const [activeField, setActiveField] = useState<FieldId | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Start blank every time it opens
      setIsFilled(false);
      setActiveField(null);
      closeBtnRef.current?.focus();
    }
  }, [isOpen]);

  const activeFieldConfig = INPUT_FIELDS.find((f) => f.id === activeField);

  function handleFieldClick(fieldId: FieldId) {
    setActiveField((prev) => (prev === fieldId ? null : fieldId));
  }

  function handleSelectAutofill() {
    setIsFilled(true);
    setActiveField(null);
  }

  return (
    <div className="paywall-layer" id="paywall-layer" hidden={!isOpen}>
      <div
        className={`paywall${isFilled ? " is-filled" : ""}`}
        id="paywall"
        role="dialog"
        aria-modal="true"
        aria-label="Supercell pay wall"
      >
        <img
          className="paywall-img paywall-blank"
          src="/paywall-transparent.png"
          alt="Supercell pay wall with empty card details"
        />
        <img
          className="paywall-img paywall-filled"
          src="/paywall-autofill-transparent.png"
          alt="Supercell pay wall with card details filled in"
        />

        <button
          ref={closeBtnRef}
          className="hotspot"
          id="paywall-close"
          aria-label="Close"
          style={{ "--x": 40, "--y": 20, "--w": 90, "--h": 85 } as HotspotStyle}
          onClick={onClose}
        />

        {INPUT_FIELDS.map((field) => (
          <button
            key={field.id}
            type="button"
            className={`hotspot paywall-input-hotspot${
              activeField === field.id ? " is-active" : ""
            }`}
            id={`paywall-field-${field.id}`}
            aria-label={field.label}
            aria-expanded={activeField === field.id}
            style={
              {
                "--x": field.x,
                "--y": field.y,
                "--w": field.w,
                "--h": field.h,
              } as HotspotStyle
            }
            onClick={() => handleFieldClick(field.id)}
          />
        ))}

        {activeFieldConfig && (
          <div
            className="paywall-dropdown"
            style={
              {
                "--x": activeFieldConfig.dropdownX,
                "--y": activeFieldConfig.dropdownY,
                "--w": activeFieldConfig.dropdownW,
              } as CSSProperties
            }
          >
            <button
              type="button"
              className="paywall-dropdown-option"
              onClick={handleSelectAutofill}
            >
              <span className="paywall-dropdown-title">DAVID SHEA</span>
              <span className="paywall-dropdown-subtitle">
                VISA •••• 1504 &nbsp;|&nbsp; EXP 11/26
              </span>
            </button>
          </div>
        )}

        <button
          className="hotspot"
          id="paywall-pay"
          aria-label="Pay"
          disabled={!isFilled}
          style={{ "--x": 764, "--y": 622, "--w": 209, "--h": 100 } as HotspotStyle}
          onClick={onClose}
        />
      </div>
    </div>
  );
}

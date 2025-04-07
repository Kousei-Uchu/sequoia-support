export const defaultProfile = {
  name: "",
  about: "",
  photo: "/images/default-avatar.png",
  sensitivities: [
    {
      icon: "sound",
      title: "Sound Sensitivity",
      description: "Loud noises can be overwhelming"
    }
  ],
  supports: [
    {
      icon: "clock",
      title: "Patience",
      description: "I may need extra time"
    }
  ],
  emergency: {
    contactName: "",
    contactNumber: "",
    instructions: [
      "Remain calm",
      "Offer quiet space"
    ]
  }
};

export const sensitivityOptions = [
  { id: "sound", label: "Sound Sensitivity", icon: "/icons/sound.png" },
  { id: "light", label: "Light Sensitivity", icon: "/icons/light.png" },
  { id: "crowd", label: "Crowd Sensitivity", icon: "/icons/space.png" },
  { id: "time", label: "Processing Speed", icon: "/icons/time.png" },
  { id: "carer", label: "Support People", icon: "/icons/carer.png" },
  { id: "safespace", label: "Quiet Space", icon: "/icons/safespace.png" },
  { id: "allergy", label: "Food Allergies", icon: "/icons/allergy.png" }
];

export const supportOptions = [
  { id: "patience", label: "Patience", icon: "clock" },
  { id: "communication", label: "Clear Communication", icon: "volume-down" },
  { id: "space", label: "Quiet Spaces", icon: "door-open" },
  { id: "instructions", label: "Clear Instructions", icon: "list-alt" }
];

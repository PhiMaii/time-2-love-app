type Device = {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  created: number;
  lastSeen: number;
  online: boolean;
  currentFWVersion?: string;
};
export type { Device };

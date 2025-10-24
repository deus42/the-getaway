import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  CameraAlertState,
  CameraNetworkAlert,
  CameraRuntimeState,
  SurveillanceHUDState,
  SurveillanceState,
  SurveillanceZoneState,
} from '../game/interfaces/types';

interface RegisterZonePayload {
  areaId: string;
  zoneId: string;
  cameras: CameraRuntimeState[];
  timestamp: number;
}

interface UpdateCameraPayload {
  areaId: string;
  cameraId: string;
  changes: Partial<CameraRuntimeState>;
  timestamp: number;
}

interface ToggleOverlayPayload {
  enabled: boolean;
}

type UpdateHudPayload = Partial<Omit<SurveillanceHUDState, 'overlayEnabled'>>;

interface SetCurfewBannerPayload {
  visible: boolean;
  timestamp: number;
}

interface SetNetworkAlertPayload {
  areaId: string;
  alert: CameraNetworkAlert | null;
}

interface ClearZonePayload {
  areaId: string;
}

const createInitialHudState = (): SurveillanceHUDState => ({
  overlayEnabled: true,
  camerasNearby: 0,
  detectionProgress: 0,
  activeCameraId: null,
  alertState: CameraAlertState.IDLE,
  networkAlertActive: false,
  networkAlertExpiresAt: null,
});

const initialState: SurveillanceState = {
  zones: {},
  hud: createInitialHudState(),
  curfewBanner: {
    visible: false,
    lastActivatedAt: null,
  },
};

const surveillanceSlice = createSlice({
  name: 'surveillance',
  initialState,
  reducers: {
    registerZoneCameras: (state, action: PayloadAction<RegisterZonePayload>) => {
      const { areaId, zoneId, cameras, timestamp } = action.payload;
      const cameraRecords = cameras.reduce<SurveillanceZoneState['cameras']>((acc, camera) => {
        acc[camera.id] = { ...camera };
        return acc;
      }, {});

      state.zones[areaId] = {
        areaId,
        zoneId,
        cameras: cameraRecords,
        networkAlert: null,
        lastUpdatedAt: timestamp,
      };
    },
    updateCameraState: (state, action: PayloadAction<UpdateCameraPayload>) => {
      const { areaId, cameraId, changes, timestamp } = action.payload;
      const zone = state.zones[areaId];

      if (!zone) {
        return;
      }

      const existing = zone.cameras[cameraId];

      if (!existing) {
        return;
      }

      zone.cameras[cameraId] = {
        ...existing,
        ...changes,
      };
      zone.lastUpdatedAt = timestamp;
    },
    setCameraNetworkAlert: (state, action: PayloadAction<SetNetworkAlertPayload>) => {
      const { areaId, alert } = action.payload;
      const zone = state.zones[areaId];

      if (!zone) {
        return;
      }

      zone.networkAlert = alert ? { ...alert } : null;
    },
    updateHudState: (state, action: PayloadAction<UpdateHudPayload>) => {
      const updates = action.payload;
      state.hud = {
        ...state.hud,
        ...updates,
      };

      if (typeof updates.networkAlertActive === 'boolean' && !updates.networkAlertActive) {
        state.hud.networkAlertExpiresAt = null;
      }
      if (typeof updates.networkAlertExpiresAt === 'number') {
        state.hud.networkAlertActive = true;
      }
    },
    setOverlayEnabled: (state, action: PayloadAction<ToggleOverlayPayload>) => {
      state.hud.overlayEnabled = action.payload.enabled;
    },
    setCurfewBanner: (state, action: PayloadAction<SetCurfewBannerPayload>) => {
      state.curfewBanner.visible = action.payload.visible;
      if (action.payload.visible) {
        state.curfewBanner.lastActivatedAt = action.payload.timestamp;
      }
    },
    clearZoneCameras: (state, action: PayloadAction<ClearZonePayload>) => {
      const { areaId } = action.payload;
      delete state.zones[areaId];
    },
    resetSurveillanceState: () => initialState,
  },
});

export const {
  registerZoneCameras,
  updateCameraState,
  setCameraNetworkAlert,
  updateHudState,
  setOverlayEnabled,
  setCurfewBanner,
  clearZoneCameras,
  resetSurveillanceState,
} = surveillanceSlice.actions;

export default surveillanceSlice.reducer;

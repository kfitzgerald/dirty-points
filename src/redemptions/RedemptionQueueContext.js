import React from "react";

export const RedemptionQueueContext = React.createContext(null);
RedemptionQueueContext.displayName = 'RedemptionQueueContext';

export function useRedemptionQueues() {
    return React.useContext(RedemptionQueueContext);
}
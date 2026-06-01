import { EstimateCommunication, EstimateMessage } from '@/ts/interfaces/Company';

export const DEFAULT_ESTIMATE_MESSAGE: EstimateMessage = {
  emailSubject: 'Estimate %estimate_number% for your review',
  emailBody: 'Please find attached estimate %estimate_number%. Valid until %valid_until%.'
};

export const DEFAULT_ACCEPTED_NOTIFICATION_MESSAGE: EstimateMessage = {
  emailSubject: 'Estimate %estimate_number% update',
  emailBody: 'Estimate %estimate_number% status update.'
};

export const DEFAULT_DECLINED_NOTIFICATION_MESSAGE: EstimateMessage = {
  emailSubject: 'Estimate %estimate_number% update',
  emailBody: 'Estimate %estimate_number% status update.'
};

export function resolveEstimateMessageForDisplay(
  message: EstimateMessage | null | undefined,
  defaults: EstimateMessage
): EstimateMessage {
  return {
    emailSubject: message?.emailSubject ?? defaults.emailSubject ?? '',
    emailBody: message?.emailBody ?? defaults.emailBody ?? ''
  };
}

export function toEstimateMessagePayload(message: EstimateMessage | null | undefined): EstimateMessage {
  return {
    emailSubject: message?.emailSubject ?? '',
    emailBody: message?.emailBody ?? ''
  };
}

export function buildEstimateCommunicationPayload(communication: EstimateCommunication): EstimateCommunication {
  return {
    estimateMessage: toEstimateMessagePayload(communication.estimateMessage),
    acceptedNotificationMessage: toEstimateMessagePayload(communication.acceptedNotificationMessage),
    declinedNotificationMessage: toEstimateMessagePayload(communication.declinedNotificationMessage)
  };
}

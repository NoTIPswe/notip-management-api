import { AlertType } from '../alerts.enum';
import { AlertsDetails } from '../interfaces/alerts.interfaces';

export class AlertsResponseDto {
  id: string;
  gatewayId: string;
  type: AlertType;
  details: AlertsDetails;
  createdAt: Date;
}

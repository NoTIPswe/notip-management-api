import { AlertType } from '../enums/alerts.enum';
import { AlertsDetails } from '../interfaces/alerts.interfaces';

export class AlertsModel {
  id: string;
  tenantId: string;
  type: AlertType;
  details: AlertsDetails;
  gatewayId: string;
  createdAt: Date;
}

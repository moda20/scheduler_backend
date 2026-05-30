export interface FlattenedProperties {
  [key: string]: {
    value: any;
    is_encrypted?: boolean;
    db_mirror?: boolean;
    job_hidden?: boolean;
    doc?: string;
    default?: string;
    format?: string;
    base?: boolean;
  };
}

export interface getConvictSchemaPropertiesInputInterface {
  encryptedValues?: boolean;
  onlyMirroredValues?: boolean;
  withJobHiddenProperties?: boolean;
}

export interface getConfigWithDBEncryptionStatusInterface
  extends getConvictSchemaPropertiesInputInterface {
  returnNotificationServiceConfig?: boolean;
}

CREATE INDEX `Project_status_createdAt_idx` ON `Project`(`status`, `createdAt`);
CREATE INDEX `Project_status_updatedAt_idx` ON `Project`(`status`, `updatedAt`);
CREATE INDEX `GenerationBatch_status_updatedAt_idx` ON `GenerationBatch`(`status`, `updatedAt`);

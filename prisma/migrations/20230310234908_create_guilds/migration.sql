-- CreateTable
CREATE TABLE `guilds` (
    `id` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NOT NULL,
    `verifiedId` VARCHAR(191) NOT NULL,
    `region` VARCHAR(191) NOT NULL,
    `language` VARCHAR(191) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `guilds_id_adminId_verifiedId_key`(`id`, `adminId`, `verifiedId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

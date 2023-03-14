-- CreateTable
CREATE TABLE `guilds` (
    `id` VARCHAR(191) NOT NULL,
    `waitingRoomId` VARCHAR(191) NOT NULL,
    `playingRoomId` VARCHAR(191) NOT NULL,
    `verifiedId` VARCHAR(191) NOT NULL,
    `region` VARCHAR(191) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `guilds_id_waitingRoomId_playingRoomId_verifiedId_key`(`id`, `waitingRoomId`, `playingRoomId`, `verifiedId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `discordId` VARCHAR(191) NOT NULL,
    `id` VARCHAR(63) NOT NULL,
    `accountId` VARCHAR(56) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `puuid` VARCHAR(78) NOT NULL,
    `region` VARCHAR(191) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_discordId_key`(`discordId`),
    UNIQUE INDEX `users_discordId_id_accountId_puuid_key`(`discordId`, `id`, `accountId`, `puuid`),
    PRIMARY KEY (`discordId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

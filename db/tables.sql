CREATE TABLE `sfl_offer_landing_pages` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`url` TEXT NOT NULL,
	`params` VARCHAR(128) NOT NULL,
	`status` ENUM('active','inactive') NOT NULL DEFAULT 'inactive',
	`user` VARCHAR(50) NOT NULL DEFAULT '0',
	`date_added` INT(11) NOT NULL,
	`date_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`)
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;

CREATE TABLE `sfl_offers` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(128) NOT NULL,
	`advertiser` VARCHAR(128) NOT NULL,
	`status` ENUM('active','inactive') NOT NULL DEFAULT 'inactive',
	`user` VARCHAR(50) NOT NULL DEFAULT '0',
	`sfl_offer_landing_page_id` INT(11) UNSIGNED NOT NULL,
	`geo` VARCHAR(10) NOT NULL,
	`payin` DECIMAL(16,8) NOT NULL DEFAULT '0.00000000',
	`payout` DECIMAL(16,8) NOT NULL DEFAULT '0.00000000',
	`date_added` INT(11) NOT NULL,
	`date_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	INDEX `fk_v_sfl_offer_lp` (`sfl_offer_landing_page_id`),
	CONSTRAINT `fk_v_sfl_offer_lp` FOREIGN KEY (`sfl_offer_landing_page_id`) REFERENCES `sfl_offer_landing_pages` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;

CREATE TABLE `sfl_offer_campaigns` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`sfl_offer_id` INT(10) UNSIGNED NOT NULL,
	`affiliate_id` INT(11) NOT NULL,
	`rules` TEXT NULL,
	`status` ENUM('active','inactive') NOT NULL DEFAULT 'inactive',
	`user` VARCHAR(50) NOT NULL DEFAULT '0',
	`date_added` INT(11) NOT NULL,
	`date_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	INDEX `fk_v_sfl_offer` (`sfl_offer_id`),
	INDEX `fk_v_sfl_offer_aff` (`affiliate_id`),
	CONSTRAINT `fk_v_sfl_offer` FOREIGN KEY (`sfl_offer_id`) REFERENCES `sfl_offers` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT `fk_v_sfl_offer_aff` FOREIGN KEY (`affiliate_id`) REFERENCES `affiliates` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;

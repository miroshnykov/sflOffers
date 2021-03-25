CREATE TABLE `sfl_offer_landing_pages` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`sfl_offer_id` INT(10) UNSIGNED NOT NULL DEFAULT '0',
	`name` VARCHAR(150) NOT NULL DEFAULT '0',
	`url` TEXT NOT NULL,
	`params` VARCHAR(128) NOT NULL,
	`status` ENUM('active','inactive') NOT NULL DEFAULT 'inactive',
	`user` VARCHAR(50) NOT NULL DEFAULT '0',
	`date_added` INT(11) NOT NULL,
	`date_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	INDEX `FK_sfl_offer_landing_pages_sfl_offers` (`sfl_offer_id`),
	CONSTRAINT `FK_sfl_offer_landing_pages_sfl_offers` FOREIGN KEY (`sfl_offer_id`) REFERENCES `sfl_offers` (`id`)
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;

CREATE TABLE `sfl_offers` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(128) NOT NULL,
	`sfl_advertiser_id` INT(11) NOT NULL DEFAULT '1',
	`advertiser_manager_id` INT(10) UNSIGNED NOT NULL DEFAULT '1',
	`sfl_vertical_id` INT(10) UNSIGNED NOT NULL DEFAULT '1',
	`descriptions` VARCHAR(255) NULL DEFAULT '',
	`status` ENUM('public','private','apply_to_run','inactive') NOT NULL DEFAULT 'inactive',
	`conversion_type` ENUM('cpi','cpa','cpl','cpc','cpm','revShare','hybrid/multistep') NOT NULL DEFAULT 'cpi',
	`currency_id` INT(10) UNSIGNED NOT NULL DEFAULT '1',
	`user` VARCHAR(50) NOT NULL DEFAULT '0',
	`sfl_offer_landing_page_id` INT(11) NULL DEFAULT '0',
	`sfl_offer_geo_id` INT(11) NULL DEFAULT '0',
	`offer_id_redirect` INT(11) NULL DEFAULT '0',
	`payout_percent` INT(11) NULL DEFAULT '0',
	`is_cpm_option_enabled` TINYINT(1) NOT NULL DEFAULT '1',
	`payin` DECIMAL(16,8) NOT NULL DEFAULT '0.00000000',
	`payout` DECIMAL(16,8) NOT NULL DEFAULT '0.00000000',
	`date_added` INT(11) NOT NULL,
	`date_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	INDEX `fk_v_sfl_offer_lp` (`sfl_offer_landing_page_id`),
	INDEX `FK_sfl_offers_sfl_advertiser` (`sfl_advertiser_id`),
	INDEX `FK_sfl_offers_sfl_employees` (`advertiser_manager_id`),
	INDEX `FK_sfl_offers_sfl_vertical` (`sfl_vertical_id`),
	CONSTRAINT `FK_sfl_offers_sfl_advertiser_managers` FOREIGN KEY (`advertiser_manager_id`) REFERENCES `sfl_advertiser_managers` (`id`),
	CONSTRAINT `FK_sfl_offers_sfl_advertisers` FOREIGN KEY (`sfl_advertiser_id`) REFERENCES `sfl_advertisers` (`id`),
	CONSTRAINT `FK_sfl_offers_sfl_vertical` FOREIGN KEY (`sfl_vertical_id`) REFERENCES `sfl_vertical` (`id`)
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;

CREATE TABLE `sfl_offer_campaigns` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`sfl_offer_id` INT(10) UNSIGNED NOT NULL,
	`name` VARCHAR(50) NOT NULL DEFAULT '',
	`affiliate_id` INT(11) NOT NULL,
	`currency_id` INT(10) UNSIGNED NOT NULL DEFAULT '1',
	`payout` DOUBLE(16,8) NULL DEFAULT '0.00000000',
	`payout_percent` INT(11) NULL DEFAULT NULL,
	`status` ENUM('active','inactive') NOT NULL DEFAULT 'inactive',
	`user` VARCHAR(50) NOT NULL DEFAULT '0',
	`date_added` INT(11) NOT NULL,
	`date_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	INDEX `fk_v_sfl_offer` (`sfl_offer_id`),
	INDEX `fk_v_sfl_offer_aff` (`affiliate_id`),
	INDEX `FK_sfl_offer_campaigns_sfl_currency` (`currency_id`),
	CONSTRAINT `FK_sfl_offer_campaigns_sfl_currency` FOREIGN KEY (`currency_id`) REFERENCES `sfl_currency` (`id`),
	CONSTRAINT `fk_v_sfl_offer` FOREIGN KEY (`sfl_offer_id`) REFERENCES `sfl_offers` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT `fk_v_sfl_offer_aff` FOREIGN KEY (`affiliate_id`) REFERENCES `affiliates` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;

CREATE TABLE `sfl_offers_cap` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`sfl_offer_id` INT(10) UNSIGNED NOT NULL,
	`clicks_day` INT(11) NOT NULL DEFAULT '0',
	`clicks_week` INT(11) NOT NULL DEFAULT '0',
	`clicks_month` INT(11) NOT NULL DEFAULT '0',
	`clicks_redirect_status` ENUM('default','custom') NOT NULL DEFAULT 'default',
	`clicks_redirect_offer_id` INT(10) UNSIGNED NOT NULL,
	`clicks_redirect_offer_use_default` TINYINT(1) NOT NULL DEFAULT '1',
	`sales_day` INT(11) NOT NULL DEFAULT '0',
	`sales_week` INT(11) NOT NULL DEFAULT '0',
	`sales_month` INT(11) NOT NULL DEFAULT '0',
	`sales_redirect_status` ENUM('default','custom') NOT NULL DEFAULT 'default',
	`sales_redirect_offer_id` INT(10) UNSIGNED NOT NULL,
	`sales_redirect_offer_use_default` TINYINT(1) NOT NULL DEFAULT '1',
	`start_date` INT(11) NOT NULL,
	`date_added` INT(11) NOT NULL,
	`date_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	UNIQUE INDEX `Index_sfl_offer_id` (`sfl_offer_id`),
	INDEX `fk_redirect_offer_id` (`clicks_redirect_offer_id`),
	INDEX `fk_sales_redirect_offer_id` (`sales_redirect_offer_id`),
	CONSTRAINT `fk_sfl_offer_id` FOREIGN KEY (`sfl_offer_id`) REFERENCES `sfl_offers` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;

CREATE TABLE `sfl_offers_cap_current_data` (
	`sfl_offer_id` INT(10) UNSIGNED NOT NULL,
	`clicks_day` INT(11) NOT NULL DEFAULT '0',
	`clicks_week` INT(11) NOT NULL DEFAULT '0',
	`clicks_month` INT(11) NOT NULL DEFAULT '0',
	`sales_day` INT(11) NOT NULL DEFAULT '0',
	`sales_week` INT(11) NOT NULL DEFAULT '0',
	`sales_month` INT(11) NOT NULL DEFAULT '0',
	`date_added` INT(11) NOT NULL,
	`date_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	UNIQUE INDEX `Index_sfl_offer_cap_current_id` (`sfl_offer_id`),
	CONSTRAINT `fk_sfl_offer_cap_current_id` FOREIGN KEY (`sfl_offer_id`) REFERENCES `sfl_offers` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;


CREATE TABLE `sfl_offer_campaign_cap` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`sfl_offer_campaign_id` INT(10) UNSIGNED NOT NULL,
	`clicks_day` INT(11) NOT NULL DEFAULT '0',
	`clicks_week` INT(11) NOT NULL DEFAULT '0',
	`clicks_month` INT(11) NOT NULL DEFAULT '0',
	`clicks_redirect_offer_id` INT(10) UNSIGNED NOT NULL,
	`sales_day` INT(11) NOT NULL DEFAULT '0',
	`sales_week` INT(11) NOT NULL DEFAULT '0',
	`sales_month` INT(11) NOT NULL DEFAULT '0',
	`sales_redirect_offer_id` INT(10) UNSIGNED NOT NULL,
	`start_date` INT(11) NOT NULL,
	`date_added` INT(11) NOT NULL,
	`date_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	UNIQUE INDEX `Index_sfl_offer_campaign_id` (`sfl_offer_campaign_id`),
	INDEX `fk1_clicks_redirect_offer_id` (`clicks_redirect_offer_id`),
	INDEX `fk1_sales_redirect_offer_id` (`sales_redirect_offer_id`),
	CONSTRAINT `fk1_clicks_redirect_offer_id` FOREIGN KEY (`clicks_redirect_offer_id`) REFERENCES `sfl_offers` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT `fk1_sales_redirect_offer_id` FOREIGN KEY (`sales_redirect_offer_id`) REFERENCES `sfl_offers` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
	CONSTRAINT `fk1_sfl_offer_id` FOREIGN KEY (`sfl_offer_campaign_id`) REFERENCES `sfl_offer_campaigns` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;


CREATE TABLE `sfl_offer_geo` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`rules` TEXT NOT NULL,
	`sfl_offer_id` INT(10) UNSIGNED NOT NULL,
	`date_added` INT(11) NOT NULL,
	`date_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	UNIQUE INDEX `offer_id_UNIQUE` (`sfl_offer_id`),
	INDEX `fk_v_sfl_offer_geo` (`sfl_offer_id`),
	CONSTRAINT `fk_v_sfl_offer_geo` FOREIGN KEY (`sfl_offer_id`) REFERENCES `sfl_offers` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;

CREATE TABLE `sfl_offer_campaign_rules` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`rules` TEXT NOT NULL,
	`position` INT(10) NOT NULL DEFAULT '0',
	`sfl_offer_campaign_id` INT(10) UNSIGNED NOT NULL,
	`status` ENUM('active','inactive') NOT NULL DEFAULT 'inactive',
	`user` VARCHAR(50) NOT NULL DEFAULT '0',
	`date_added` INT(11) NOT NULL,
	`date_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	INDEX `fk_v_sfl_offer_rules` (`sfl_offer_campaign_id`),
	CONSTRAINT `fk_v_sfl_offer_rules` FOREIGN KEY (`sfl_offer_campaign_id`) REFERENCES `sfl_offer_campaigns` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;

CREATE TABLE `sfl_offer_custom_landing_pages` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`rules` TEXT NOT NULL,
	`sfl_offer_id` INT(10) UNSIGNED NOT NULL,
	`date_added` INT(11) NOT NULL,
	`date_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	UNIQUE INDEX `lp_offer_id_UNIQUE` (`sfl_offer_id`),
	INDEX `fk_v_sfl_custom_lp` (`sfl_offer_id`),
	CONSTRAINT `fk_v_sfl_custom_lp` FOREIGN KEY (`sfl_offer_id`) REFERENCES `sfl_offers` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;

CREATE TABLE `sfl_offers_history` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`sfl_offer_id` INT(10) UNSIGNED NOT NULL,
	`user` VARCHAR(50) NOT NULL DEFAULT '0',
	`action` VARCHAR(50) NOT NULL DEFAULT '',
	`date_added` INT(11) NOT NULL,
	`logs` TEXT NOT NULL,
	PRIMARY KEY (`id`),
	INDEX `fk_v_sfl_offer_history` (`sfl_offer_id`),
	CONSTRAINT `fk_v_sfl_offer_history` FOREIGN KEY (`sfl_offer_id`) REFERENCES `sfl_offers` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;

CREATE TABLE `sfl_advertisers` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(100) NOT NULL,
	`status` ENUM('active','inactive') NOT NULL DEFAULT 'inactive',
	`advertiser_manager_id` INT(10) UNSIGNED NOT NULL,
	`origin_id` INT(10) UNSIGNED NOT NULL,
	`website` VARCHAR(100) NOT NULL,
	`tags` VARCHAR(100) NOT NULL,
	`descriptions` VARCHAR(256) NOT NULL,
	`date_added` INT(11) NOT NULL,
	`date_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	UNIQUE INDEX `Index 3` (`name`),
	INDEX `fk_sfl_advertiser_id` (`advertiser_manager_id`)
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;

CREATE TABLE `sfl_advertiser_managers` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`first_name` VARCHAR(100) NOT NULL,
	`last_name` VARCHAR(100) NOT NULL,
	`email` VARCHAR(50) NOT NULL,
	`office` VARCHAR(50) NOT NULL,
	`date_added` INT(11) NOT NULL,
	`date_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	UNIQUE INDEX `sfl_advertiser_managers` (`first_name`, `last_name`, `email`)
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;

CREATE TABLE `sfl_affiliates` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(250) NOT NULL,
	`email` VARCHAR(50) NOT NULL,
	`status` ENUM('active','inactive','pending','rejected','suspended') NOT NULL DEFAULT 'inactive',
	`affiliate_manager_id` INT(10) UNSIGNED NOT NULL,
	`origin_id` INT(10) UNSIGNED NOT NULL,
	`salesforce_id` VARCHAR(18) NULL DEFAULT '0',
	`billing_cycle` ENUM('daily','weekly','monthly') NOT NULL DEFAULT 'weekly',
	`payment_type` VARCHAR(50) NOT NULL,
	`currency` ENUM('US','EUR','CAD') NOT NULL DEFAULT 'US',
	`last_traffic_date` INT(11) NOT NULL,
	`postback_url` VARCHAR(250) NOT NULL,
	`date_added` INT(11) NOT NULL,
	`date_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	UNIQUE INDEX `unique_name` (`name`, `id`),
	INDEX `fk_sfl_affiliates_id` (`affiliate_manager_id`),
	CONSTRAINT `fk_sfl_affiliates_id` FOREIGN KEY (`affiliate_manager_id`) REFERENCES `sfl_affiliate_managers` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;


CREATE TABLE `sfl_affiliate_managers` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(200) NOT NULL,
	`email` VARCHAR(50) NOT NULL,
	`date_added` INT(11) NOT NULL,
	`date_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	UNIQUE INDEX `sfl_advertiser_managers` (`name`, `email`)
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;

CREATE TABLE `sfl_currency` (
	`id` INT(10) UNSIGNED NOT NULL,
	`symbol` VARCHAR(45) NOT NULL,
	`abbr` VARCHAR(45) NOT NULL,
	PRIMARY KEY (`id`)
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;

CREATE TABLE `sfl_vertical` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(100) NOT NULL,
	`date_added` INT(11) NOT NULL,
	`date_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	UNIQUE INDEX `sfl_vertical` (`id`, `name`)
)
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;


INSERT INTO `sfl_offer_custom_landing_pages`
            (`rules`,
             `sfl_offer_id`)
VALUES      (
'{"sflOfferCustomLandingPages":[{"url":"testLP1.com","country":"CA"},{"url":"testLP2.com","country":"US"},{"url":"testLP3.com","country":"FR"}]}'
,
'25'
);



INSERT INTO `sfl_offer_geo` (`rules`, `sfl_offer_id`, `date_added`) VALUES ('{"geo":[{"include":true,"country":"CA"},{"include":false,"country":"US"},{"include":false,"country":"US"}]}', '17','1606753419');


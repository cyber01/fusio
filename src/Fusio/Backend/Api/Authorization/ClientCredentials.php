<?php
/*
 * fusio
 * A web-application to create dynamically RESTful APIs
 * 
 * Copyright (C) 2015 Christoph Kappestein <k42b3.x@gmail.com>
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

namespace Fusio\Backend\Api\Authorization;

use Doctrine\DBAL\Connection;
use Hautelook\Phpass\PasswordHash;
use PSX\Oauth2\Provider\GrantType\ClientCredentialsAbstract;
use PSX\Oauth2\Provider\Credentials;
use PSX\Oauth2\AccessToken;
use PSX\Oauth2\Authorization\Exception\ServerErrorException;

/**
 * ClientCredentials
 *
 * @author  Christoph Kappestein <k42b3.x@gmail.com>
 * @license http://www.gnu.org/licenses/gpl-3.0
 * @link    http://phpsx.org
 */
class ClientCredentials extends ClientCredentialsAbstract
{
	protected $connection;

	public function __construct(Connection $connection)
	{
		$this->connection = $connection;
	}

	protected function generate(Credentials $credentials, $scope)
	{
		$sql = 'SELECT id, 
				       name, 
				       password
			      FROM fusio_user
			     WHERE status = :status
			       AND name = :name';

		$user = $this->connection->fetchAssoc($sql, array(
			'status' => 1,
			'name'   => $credentials->getClientId(),
		));

		if(!empty($user))
		{
			if(password_verify($credentials->getClientSecret(), $user['password']))
			{
				// generate access token
				$accessToken = hash('sha256', uniqid());

				$sql = 'INSERT INTO fusio_app_token
								SET appId = :app_id, 
								    userId = :user_id, 
								    token = :token, 
								    scope = :scope, 
								    ip = :ip, 
								    expire = :expire, 
								    date = NOW()';

				$expires = new \DateTime();
				$expires->add(new \DateInterval('PT6H'));

				$this->connection->executeUpdate($sql, array(
					'app_id'  => 1,
					'user_id' => $user['id'],
					'token'   => $accessToken,
					'scope'   => 'backend',
					'ip'      => $_SERVER['REMOTE_ADDR'],
					'expire' => $expires->getTimestamp(),
				));

				$token = new AccessToken();
				$token->setAccessToken($accessToken);
				$token->setTokenType('bearer');
				$token->setExpiresIn($expires->getTimestamp());
				$token->setScope('backend');

				return $token;
			}
			else
			{
				throw new ServerErrorException('Invalid password');
			}
		}
		else
		{
			throw new ServerErrorException('Unknown user');
		}
	}
}
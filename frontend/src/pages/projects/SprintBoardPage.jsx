import React from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import SprintBoard from '@/components/sprintboard';

/**
 * Sprint Board Page Component
 * Refactored to separate view (SprintBoard) from routing context
 */
const SprintBoardPage = () => {
	const { orgSlug, projectSlug } = useParams();
	const navigate = useNavigate();
	const { project } = useOutletContext();

	return (
		<SprintBoard
			orgSlug={orgSlug}
			projectSlug={projectSlug}
			project={project}
			navigate={navigate}
		/>
	);
};

export default SprintBoardPage;

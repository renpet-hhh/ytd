import React from 'react';
import { View, StyleSheet, TouchableWithoutFeedback } from 'react-native';

interface Props {
	children: React.ReactElement;
	visible: boolean;
	close: () => void;
}
const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		flex: 1,
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: 'transparent',
	},
	full: {
		flex: 1,
	},
});

const AbsoluteBackground = ({ children, visible, close }: Props): JSX.Element | null => {
	if (!visible) return null;
	return (
		<TouchableWithoutFeedback style={styles.full} onPressOut={close}>
			<View style={styles.container}>
				{React.cloneElement(children, { onStartShouldSetResponder: () => true })}
			</View>
		</TouchableWithoutFeedback>
	);
};

export default AbsoluteBackground;

// import React from 'react';
// import { Modal, TouchableWithoutFeedback, ModalProps } from 'react-native';
// import { FullWrapper } from 'src/styled_components/basic';

// interface OwnProps {
// 	children: React.ReactElement;
// 	onBlur: () => void;
// }

// const TransparentModal = ({ children, onBlur, ...props }: OwnProps & ModalProps): JSX.Element => {
// 	return (
// 		<Modal transparent onRequestClose={onBlur} {...props}>
// 			<TouchableWithoutFeedback onPress={onBlur}>
// 				<FullWrapper>{children}</FullWrapper>
// 			</TouchableWithoutFeedback>
// 		</Modal>
// 	);
// };

// export default TransparentModal;
